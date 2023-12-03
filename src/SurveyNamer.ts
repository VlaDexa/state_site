import Auth from "./Auth";
import Login from "./Login";
import Survey from "./Survey";
import { Renderable, changePage } from "./utils";

export default class SurveyNamer implements Renderable {
    constructor() { }

    render(): HTMLElement {
        if (!Auth.has())
            changePage(Login);
        history.pushState(undefined, "", "survey-creator");
        const namer = document.createElement("t-survey-namer");
        const form = namer.shadowRoot!.querySelector("form")!;
        const datePicker = form.querySelector("input[type=datetime-local]")! as HTMLInputElement;
        const now = new Date();
        datePicker.min = now.toISOString().slice(0, 16);
        form.onsubmit = async (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const name = data.get("name")!;
            const expire = data.get("date")!;
            const auth = Auth.fromStorage();
            if (!auth)
                return location.replace("/login");
            const req = await fetch("http://api.lapki.vladexa.ru:8000/api/v1/survey", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": auth.toAuthorization(),
                },
                body: `{"name":"${name}","expire_at":"${expire}"}`
            });
            if (req.status !== 200) return alert("Error at creation");
            changePage(Survey, name.toString());
        };
        return namer;
    }
}

