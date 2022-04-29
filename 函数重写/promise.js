function resolvePromise(promise2, x, resolve, reject) {
  // 循环引用问题
  if (x === promise2) {
    return reject(new TypeError("Chaining cycle detected for promise"));
  }
  if (x instanceof myPromise) {
    // 如果x为promise，则使promise2接收x的状态
    if (x.PromiseState === myPromise.PENDING) {
      x.then((y) => {
        resolvePromise(promise2, y, resolve, reject);
      }, reject);
    } else if (x.PromiseState === myPromise.FULFILLED) {
      resolve(x.PromiseResult);
    } else if (x.PromiseState === myPromise.REJECTED) {
      reject(x.PromiseResult);
    }
  } else if (x !== null && (typeof x === "object" || typeof x === "function")) {
    try {
      var then = x.then;
    } catch (e) {
      return reject(e);
    }
    if (typeof then === "function") {
      let called = false;
      try {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            reject(r);
          }
        );
      } catch (e) {
        if (called) return;
        called = true;
        reject(e);
      }
    } else {
      // 如果then不是函数，则以x为参数执行promise
      resolve(x);
    }
  } else {
    // 如果x不为对象或函数，则以x为参数执行promise
    return resolve(x);
  }
}
class myPromise {
  // 三个状态
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";
  constructor(func) {
    // 初始化为pending状态
    this.PromiseState = myPromise.PENDING;
    // 初始化resolve或reject传入的参数
    this.PromiseResult = null;
    // 保存成功状态的回调函数
    this.onFulfilledCallbacks = [];
    // 保存失败状态的回调函数
    this.onRejectedCallbacks = [];
    try {
      func(this.resolve, this.reject);
    } catch (error) {
      this.reject(error);
    }
  }
  //  因为resolve和reject是箭头函数，使用的this将是class
  resolve = (result) => {
    if (this.PromiseState === myPromise.PENDING) {
      queueMicrotask(() => {
        // 改变为成功状态
        this.PromiseState = myPromise.FULFILLED;
        // 将传入的参数进行保存，方便后面链式调用使用
        this.PromiseResult = result;
        // resolve时直接执行保存在数组内的函数
        this.onFulfilledCallbacks.forEach((callback) => {
          callback(result);
        });
      });
    }
  };
  reject = (reason) => {
    if (this.PromiseState === myPromise.PENDING) {
      queueMicrotask(() => {
        // 改变为失败状态
        this.PromiseState = myPromise.REJECTED;
        // 将传入的参数进行保存，方便后面链式调用使用
        this.PromiseResult = reason;
        this.onRejectedCallbacks.forEach((callback) => {
          callback(reason);
        });
      });
    }
  };
  then(onFulfilled, onRejected) {
    // 如果then的resolve不是一个函数，将会直接返回该参数
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    // 如果then的reject不是函数，将会直接用这个参数throw一个错误
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };
    // 需要返回一个promise用于链式调用
    const promise2 = new myPromise((resolve, reject) => {
      // 如果resolve或reject通知是在宏任务里，那么在执行then时，状态并没有改变
      if (this.PromiseState === myPromise.PENDING) {
        // // 将then中的函数进行保存
        this.onFulfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
        this.onRejectedCallbacks.push(() => {
          try {
            let x = onRejected(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }
      // 保证状态只能改变一次
      if (this.PromiseState === myPromise.FULFILLED) {
        queueMicrotask(() => {
          try {
            let x = onFulfilled(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(e);
          }
        });
      }
      if (this.PromiseState === myPromise.REJECTED) {
        queueMicrotask(() => {
          try {
            let x = onRejected(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(e);
          }
        });
      }
    });
    return promise2;
  }
}
// 对resolve()，reject()进行改造增强
/**
 * 对resolve()、reject() 进行改造增强 针对resolve()和reject()中不同值情况 进行处理
 * @param  {promise} promise2 promise1.then方法返回的新的promise对象
 * @param  {[type]} x         promise1中onFulfilled或onRejected的返回值
 * @param  {[type]} resolve   promise2的resolve方法
 * @param  {[type]} reject    promise2的reject方法
 */

// const promisettest = new Promise((resolve, reject) => {
//     reject('aaa')
// }).then(undefined, undefined)

// console.log(promise2);
myPromise.deferred = function () {
  let result = {};
  result.promise = new myPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};
export { myPromise };
// module.exports = myPromise;
