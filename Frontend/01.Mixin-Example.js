class Circle {
  constructor(length, height) {
    this.length = length;
    this.height = height;
  }
}

class Square {
  constructor(length, height) {
    this.length = length;
    this.height = height;
  }
}
/**
 *  如果我要求他们面积的话，可以各自定义求面积的方法，但是会重复代码；我们可以抽取一个
 *  公共类Shape，定义CalcArea，但是如果不想抽取类的话或者两个类没有什么相关的方法和属性
 *  的话，可以使用Mixin，相当于抽取到Utils，可以使用里面的方法
 */

const extend = (prototype, source) =>
  Object.keys(source).forEach((key) => (prototype[key] = source[key]));

const Utils = {
  calcArea() {
    return this.length * this.height;
  },
};


Object.assign(Circle.prototype, Utils)  // 可遍历属性 浅拷贝
// extend(Circle.prototype, Utils);
extend(Square.prototype, Utils);

const c = new Circle(10, 10);
const s = new Square(12, 12);

console.log(c.calcArea());  // 100
console.log(s.calcArea());  // 144
