/**
 * asyncLib
 * super 2012 https://github.com/medns/AsyncLib
 * new BSD Licensed
 */

var _slice = Array.prototype.slice;

exports.group = function(context, fn, params, callback) {
	var count = params.length, arr = [];
	params.forEach(function(param, index) {
		var pm = Array.isArray(param) ? param : [param];
		fn.apply(context, pm.concat([function() {
			arr[index] = _slice.apply(arguments);
			count -= 1;
			if (count === 0) {
				callback(arr);
			}
		}]));
	});
};

exports.each = function(context, fn, params, callback) {
	var count = params.length,
		fn = function() {
			if (callback.apply(this, [count - params.length, count].concat(_slice.apply(arguments))) && params.length > 0) {
				fn.apply(context, params.shift().concat([fn]));
			}
		};
	fn.apply(context, params.shift().concat([fn]));
};

exports.if = function(expression, context, fn, params, callback) {
	expression = !!expression;
	if (expression) {
		fn.apply(context, params, function() {
			callback.apply(null, [expression].concat(_slice(arguments)));
		});
	} else {
		callback(expression);
	}
};

exports.LockClass = function() {
	this._lock = [];
}
exports.LockClass.prototype.line = function(fn, ths) {
	var context = this;
	return function() {
		var i, obj = arguments[0], isFind = false;
		for (i = 0; i < context._lock.length; i += 1) {
			if (context._lock[i].obj === obj) {
				context._lock[i].data.push({
					context : ths,
					fn : fn,
					arguments : arguments
				});
				isFind = true;
				break;
			}
		}
		if (!isFind) {
			context._lock.push({
				obj : obj,
				isRuning : false,
				data : [{
					context : ths,
					fn : fn,
					arguments : arguments
				}]
			});
		}
		context.exec();
	};
};
exports.LockClass.prototype.exec = function() {
	var context = this;
	this._lock.forEach(function(item) {
		var data;
		if (!item.isRuning) {
			item.isRuning = true;
			data = item.data.shift();
			data.fn.apply(data.context, _slice.apply(data.arguments, [0, data.arguments.length - 1]).concat([function() {
				data.arguments[data.arguments.length - 1].apply(this, _slice.apply(arguments));

				item.isRuning = false;
				if (item.data.length === 0) {
					context._lock.splice(context._lock.indexOf(item), 1);
				} else {
					context.exec();
				}
			}]));
		}
	});
};