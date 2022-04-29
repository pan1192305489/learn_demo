class MyPromise {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";
  constructor(executor) {
    this.status = MyPromise.PENDING;
    this.value = null;
    // 解决问题二
    // 当状态改变后从这个数组中拿出回调函数来执行
    this.callbacks = [];
    try {
      executor(this.resolve.bind(this), this.rejecte.bind(this));
    } catch (error) {
      this.rejecte(error);
    }
  }
  resolve(value) {
    if (this.status === MyPromise.PENDING) {
      this.status = MyPromise.FULFILLED;
      this.value = value;
      queueMicrotask(() => {
        this.callbacks.map((callback) => {
          callback.onFulfilled(value);
        });
      });
    }
  }
  rejecte(reason) {
    if (this.status === MyPromise.PENDING) {
      this.status = MyPromise.REJECTED;
      this.value = reason;
      queueMicrotask(() => {
        this.callbacks.map((callback) => {
          callback.onRejected(reason);
        });
      });
    }
  }
  then(onFulfilled, onRejected) {
    //   问题一：当不传值或者传null时，相当于不执行函数
    if (typeof onFulfilled !== "function") {
      onFulfilled = () => {
        //   then的穿透传递
        return this.value;
      };
    }
    if (typeof onRejected !== "function") {
      onRejected = () => {
        console.log(this.value);
        return this.value;
      };
    }
    let promise = new Promise((resolve, rejecte) => {
      if (this.status === MyPromise.FULFILLED) {
        queueMicrotask(() => {
          //   问题三：链式调用，返回值要传递给下一个then
          try {
            this.parse(promise, onFulfilled(this.value), resolve, rejecte);
          } catch (error) {
            rejecte(error);
          }
        });
      }
      if (this.status === MyPromise.REJECTED) {
        queueMicrotask(() => {
          try {
            this.parse(promise, onRejected(this.value), resolve, rejecte);
          } catch (err) {
            rejecte(err);
          }
        });
      }
      // 问题二： 当改变状态的语句是异步执行时，会造成执行了then但状态并没有改变
      if (this.status === MyPromise.PENDING) {
        // 作为一个对象进行存储
        this.callbacks.push({
          onFulfilled: (value) => {
            try {
              this.parse(promise, onFulfilled(this.value), resolve, rejecte);
            } catch (error) {
              //  出错就传递给下一个then的rejecte处理
              rejecte(error);
            }
          },
          onRejected: (value) => {
            try {
              this.parse(promise, onRejected(this.value), resolve, rejecte);
            } catch (error) {
              rejecte(error);
            }
          },
        });
      }
    });
    return promise;
  }
  parse(promise, result, resolve, rejecte) {
    if (promise === result) {
      throw new TypeError("Chaining cycle detected");
    }
    if (result instanceof MyPromise) {
      result.then(resolve, rejecte);
    } else {
      //   传递给下一个then
      resolve(result);
    }
  }
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const promiseResults = [];
      let iteratorIndex = 0;
      // 已完成的数量，用于最终的返回，不能直接用完成数量作为iteratorIndex
      // 输出顺序和完成顺序是两码事
      let fullCount = 0;
      // 用于迭代iterator数据
      for (const item of promises) {
        // for of 遍历顺序，用于返回正确顺序的结果
        // 因iterator用forEach遍历后的key和value一样，所以必须存一份for of的 iteratorIndex
        let resultIndex = iteratorIndex;
        iteratorIndex += 1;
        // 包一层，以兼容非promise的情况
        item.then(
          (res) => {
            promiseResults[resultIndex] = res;
            fullCount += 1;
            // Iterator 接口的数据无法单纯的用length和size判断长度，不能局限于Array和 Map类型中
            if (fullCount === iteratorIndex) {
              resolve(promiseResults);
            }
          },
          (reason) => {
            reject(reason);
          }
        );
      }
      // 处理空 iterator 的情况
      if (iteratorIndex === 0) {
        resolve(promiseResults);
      }
    });
  }
  // function promiseAll (args) {
  //   return new Promise((resolve, reject) => {
  //     const promiseResults = [];
  //     let iteratorIndex = 0;
  //     // 已完成的数量，用于最终的返回，不能直接用完成数量作为iteratorIndex
  //     // 输出顺序和完成顺序是两码事
  //     let fullCount = 0;
  //     // 用于迭代iterator数据
  //     for (const item of args) {
  //       // for of 遍历顺序，用于返回正确顺序的结果
  //       // 因iterator用forEach遍历后的key和value一样，所以必须存一份for of的 iteratorIndex
  //       let resultIndex = iteratorIndex;
  //       iteratorIndex += 1;
  //       // 包一层，以兼容非promise的情况
  //       Promise.resolve(item).then(res => {
  //         promiseResults[resultIndex] = res;
  //         fullCount += 1;
  //         // Iterator 接口的数据无法单纯的用length和size判断长度，不能局限于Array和 Map类型中
  //         if (fullCount === iteratorIndex) {
  //           resolve(promiseResults)
  //         }
  //       }).catch(err => {
  //         reject(err)
  //       })
  //     }
  //     // 处理空 iterator 的情况
  //     if(iteratorIndex===0){
  //       resolve(promiseResults)
  //     }
  //   }
  //   )
  // }
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.map((promise) => {
        Promise.resolve(promise).then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    });
  }
}
// MyPromise.deferred = function () {
//   let result = {};
//   result.promise = new MyPromise((resolve, reject) => {
//     result.resolve = resolve;
//     result.reject = reject;
//   });
//   return result;
// };
// module.exports = MyPromise;
