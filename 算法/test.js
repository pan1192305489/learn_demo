const input = [["a", "b", "cd"], ["de"], ["e", "f"]];

// 暴力解法
const concatStr1 = (doubleList) => {
  let res = doubleList.reduce((prev, cur) => {
    const temp = [];
    prev.forEach((val) => {
      cur.forEach((item) => {
        emptyVal.push(`${val}${item}`);
      });
    });
    return temp;
  });
  return res;
};
console.log(concatStr1(input));

// 递归解法
const concatStr2 = (doubleList) => {
  if (doubleList.length == 0) return [];
  //先return掉空的
  const result = [];
  const backtrack = (doubleList, index, currentList) => {
    //递归终点
    if (index >= doubleList.length) {
      result.push([...currentList].join(""));
    } else {
      //循环递归
      doubleList[index].forEach((item) => {
        //累加当前数组
        currentList.push(item);
        //递归
        backtrack(doubleList, index + 1, currentList);
        currentList.pop();
      });
    }
  };
  backtrack(doubleList, 0, []);
  return result;
};
console.log(concatStr2(input));
