import Auth from "./Auth";
import Login from "./Login";
import Question from "./Question";
import QuestionEditElement from "./QuestionEditElement";
import { Renderable, changePage, rerender } from "./utils";

export default class Survey implements Renderable {
    constructor(private name: string, private questions: Question[] = [new Question()]) { }

    render(): HTMLElement {
        if (!Auth.has())
            changePage(Login);
        history.pushState({ name: this.name }, "", "survey");
        const namer = document.createElement("t-survey");
        const name = document.createElement("h2");
        name.slot = "name";
        name.style.margin = "0";
        name.style.fontSize = "2em";
        name.innerText = history.state.name;
        namer.appendChild(name);
        const addButton = namer.shadowRoot!.getElementById("add-question")!;
        addButton.onclick = () => {
            this.questions.push(new Question());
            dispatchEvent(rerender);
        }
        const questions = document.createElement("ul");
        questions.slot = "questions";
        for (const questionIndex in this.questions) {
            const questionHolder = document.createElement("li");
            const questionElement = document.createElement("section", { is: "t-question-edit" }) as QuestionEditElement;
            questionElement.onchange = () => this.questions[questionIndex].title = questionElement.questionName;
            const nameInput = questionElement.shadowRoot!.querySelector("#name")! as HTMLInputElement;
            nameInput.value = this.questions[questionIndex].title;
            questionHolder.appendChild(questionElement);
            questions.appendChild(questionHolder);
        }
        namer.appendChild(questions);
        return namer;
    }
}
