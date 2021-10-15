const lx = init("我在校园日检日报");
/******************
我在校园日检日报脚本
update:20220124
理论上支持QuanX,Surge,Loon,但没有进行测试。

1. 务必遵守疫情防控、法律法规、校规！
2. 仅供交流学习，一切责任由使用者自负，与作者无关。

1.可选择手动配置JWSESSION或者通过rewrite自动获取JWSESSION
2.手动设置打卡需要的数据，脚本运行成功后会保存
3.启用task 或 启用IOS的快捷指令自动化 实现自动打卡。

*******************
【Quantumult X配置】
#rewrite_local规则，访问“我的课程”时自动获取JWSESSION
[rewrite_local]
^https://student.wozaixiaoyuan.com/course/getCourseList.json url script-request-header heat.js

[mitm]
hostname = student.wozaixiaoyuan.com

#task_local规则，每天定时自动执行脚本
[task_local]
5 0,11,15 * * * heat.js, tag=日检日报, enabled=true

******************/

//######	Config
clear_data = false;			//当为true时，清除已保存的打卡数据
clear_token = false;		//当为true时，清除已保存的JWSESSION


//手动设置，如不想使用rewrite可自行设置token。运行后会被储存。留空不会重置。
var user_token = "";		//用户JWSESSION，如果存在则会被持久化储存。
var user_UA = ""			//模拟UA，如果存在则会被持久化储存。

//以下数据自行修改,(打卡成功后会被持久化储存)。留空不会重置

const answers = '["0"]';		//选择题选项
const temperature = '36.666';	//体温（摄氏）
const latitude = '23.666';		//纬度
const longitude = '112.666';	//经度
const country = '中国';			//国家
const city = '佛山市';			//城市
const district = '三水区';		//区
const province = '广东省';		//省
const township = '云东海街道';	//镇、街道
const street = '学海中路';		//街、路

//以下数据自行修改，一般可为空
const userId = '';
const myArea = '';
const areacode = '';

//以下全局变量，如无特别需要，不要更改

const token = "wzxy_JWSESSION";
const UA = "wzxy_User-Agent";
const data = "wzxy_checkIn_data";		//	持久化存储打卡数据
var seqname = "打卡时段";
var seq = "打卡时段";

//不同学校的打卡时间可能不一样，注意修改getSeq（）的条件判断
function getSeq() {
	const myDate = new Date();
	const hours = myDate.getHours();
	if (0 <= hours && hours < 9) {
		return [1, "早打卡"]
	};
	if (11 <= hours && hours < 15) {
		return [2, "午打卡"]
	};
	if (17 <= hours && hours < 23) {
		return [3, "晚打卡"]
	};
	return [-1, "非打卡时段"]
};
function main() {
	if (clear_data) {
		lx.w("", data);
		lx.log("打卡数据已清除")
	};
	if (clear_token) {
		lx.w("", token);
		lx.w("", UA);
		lx.log("JWSESSION和UA已清除")
	};
	if (user_token) {
		lx.w(user_token, token);
		lx.log("存储JWSESSION" + user_token)
	};
	if (user_UA) {
		lx.w(user_UA, UA)
		lx.log("存储User-Agent" + user_UA)
	};
	let url = {
		url: "https://student.wozaixiaoyuan.com/heat/save.json",
		headers: {
			"Accept-Encoding": "gzip,compress,br,deflate",
			"content-type": "application/x-www-form-urlencoded",
			"Connection": "keep-alive",
			"Referer": "https://servicewechat.com/wxce6d08f781975d91/181/page-frame.html",
			"Host": "student.wozaixiaoyuan.com",
			"User-Agent": lx.r(UA),
			"JWSESSION": lx.r(token)
		}
	};
	lx.log("JWSESSION:" + url.headers["JWSESSION"]);
	seq = getSeq()[0];
	seqname = getSeq()[1];
	lx.log("seq:" + seq + ",seqname:" + seqname);
	if (seq == -1) {
		lx.msg("打卡失败", "不在打卡时段");
		lx.log("打卡失败,不在打卡时段");
		lx.done()
	} else {
		if (lx.r(data)) {
			url.body = lx.r(data);
			url.body = url.body.replace(/seq=\d/, "seq=" + seq)		//seq=1,2,3
		} else {
			url.body = 'answers=' + answers + '&seq=' + seq + '&temperature=' + temperature + '&userId=' + userId + '&latitude=' + latitude + '&longitude=' + longitude + '&country=' + country + '&city=' + city + '&district=' + district + '&province=' + province + '&township=' + township + '&street=' + street + '&myArea=' + myArea + '&areacode=' + areacode;
			url.body = encodeURI(url.body);
		};
		//发包
		lx.post(url, function (err, res, body) {
			const signtime = new Date();
			lx.log(res.body);
			const resp = JSON.parse(res.body);
			if (resp.code == 0) {
				lx.msg(seqname, "打卡成功", signtime);
				lx.log(seqname + ",打卡成功," + signtime, decodeURI(url.body));
				if (lx.r(data)) {
					lx.done()
				} else {
					lx.w(url.body, data);
					lx.log("存储打卡数据",)
				};
				lx.done()
			} else {
				lx.msg(seqname, resp.message, signtime);
				lx.log(seqname + "," + resp.message + "," + signtime, decodeURI(url.body));
				lx.done()
			}
		})
	}
};
function getToken() {
	if ($request.headers) {
		const t = $request.headers["JWSESSION"];
		lx.w(t, token);
		lx.msg("获取JWSESSION成功", "", t);
		lx.log("获取JWSESSION成功" + t);
		const ua = $request.headers["User-Agent"];
		lx.w(ua, UA);
		lx.msg("获取User-Agent成功", "", ua);
		lx.log("获取User-Agent成功" + ua);
		lx.done()
	}
};
function start() {
	const isRequest = typeof $request != "undefined";
	if (isRequest) {
		const isPost = $request.method == "POST";
		if (isPost) {
			getToken();
		} else {
			lx.done()
		}
	} else {
		main()
	}
};
function init(name) {//参考了@NobyDa和@chavyleung的环境封装
	const startTime = new Date().getTime();
	const isNode = function () {
		return 'undefined' !== typeof module && !!module.exports
	};
	const isQuanX = function () {
		return 'undefined' !== typeof $task
	};
	const isSurge = function () {
		return 'undefined' !== typeof $httpClient && 'undefined' === typeof $loon
	};
	const isLoon = function () {
		return 'undefined' !== typeof $loon
	};
	const toObj = function (str, defaultValue = null) {
		try {
			return JSON.parse(str)
		} catch {
			return defaultValue
		}
	};
	const toStr = function (obj, defaultValue = null) {
		try {
			return JSON.stringify(obj)
		} catch {
			return defaultValue
		}
	};
	const msg = function (title, subtitle = '', desc = '') {
		if (isQuanX()) {
			$notify(title, subtitle, desc)
		} else if (isSurge() || isLoon()) {
			$notification.post(title, subtitle, desc)
		}
	};
	const log = function (...logs) {
		if (logs.length > 0) {
			logs = [...logs]
		};
		console.log(logs.join("\n"))
	};
	const get = function (opts, callback = function () { }) {
		if (isSurge() || isLoon()) {
			$httpClient.get(opts, function (err, res, body) {
				if (!err && res) {
					res.body = body;
					res.statusCode = res.status
				};
				callback(err, res, body)
			})
		} else if (isQuanX()) {
			opts.method = "GET";
			$task.fetch(opts).then(function (res) {
				const {
					statusCode: status,
					statusCode,
					headers,
					body
				} = res;
				callback(null, {
					status,
					statusCode,
					headers,
					body
				}, body)
			}, function (err) {
				callback(err)
			})
		}
	};
	const post = function (opts, callback = function () { }) {
		if (isSurge() || isLoon()) {
			$httpClient.post(opts, function (err, res, body) {
				if (!err && res) {
					res.body = body;
					res.statusCode = res.status
				};
				callback(err, res, body)
			})
		} else if (isQuanX()) {
			opts.method = "POST";
			$task.fetch(opts).then(function (res) {
				const {
					statusCode: status,
					statusCode,
					headers,
					body
				} = res;
				callback(null, {
					status,
					statusCode,
					headers,
					body
				}, body)
			}, function (err) {
				callback(err)
			})
		}
	};
	const r = function (key) {
		if (isQuanX()) {
			return $prefs.valueForKey(key)
		} else if (isSurge() || isLoon()) {
			return $persistentStore.read(key)
		}
	};
	const w = function (val, key) {
		if (isQuanX()) {
			return $prefs.setValueForKey(val, key)
		} else if (isSurge() || isLoon()) {
			return $persistentStore.write(val, key)
		}
	};
	const wait = function (time) {
		return new Promise(function (resolve) {
			setTimeout(resolve, time)
		})
	};
	const done = function (val = {}) {
		const endTime = new Date().getTime();
		const costTime = (endTime - startTime) / 1000;
		log(name + " 结束运行，耗时：" + costTime);
		if (isQuanX() || isSurge() || isLoon()) {
			$done(val)
		}
	};
	return {
		msg,
		log,
		get,
		post,
		done,
		r,
		w,
		wait,
		toObj,
		toStr,
		isLoon,
		isNode,
		isQuanX,
		isSurge
	}
};

start();