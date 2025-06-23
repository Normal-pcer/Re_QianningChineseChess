var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Serializable, TypeRegistry } from "./serialize.js";
let B = class B extends Serializable {
    apply() { }
    apply2() { }
};
B = __decorate([
    TypeRegistry.register()
], B);
class Box {
    item;
    constructor(item) {
        this.item = item;
    }
}
class C {
    list = [];
    add(item) {
        this.list.push(item);
    }
}
function main() {
    let container = new C();
    let box = new Box(new B);
    container.add(box);
}
main();
//# sourceMappingURL=test2.js.map