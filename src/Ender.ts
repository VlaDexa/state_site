import { Renderable } from "./utils";

export default class Ender implements Renderable {
    render(): HTMLElement {
        return document.createElement("t-ender");
    }
}
