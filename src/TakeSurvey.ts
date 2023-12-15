import Auth from "./Auth";
import Ender from "./Ender";
import Login from "./Login";
import Question from "./Question";
import QuestionEditElement from "./QuestionEditElement";
import { SurveyId } from "./SurveyId";
import { Renderable, changePage, rerender } from "./utils";

export default class TakeSurvey implements Renderable {
	private questions: Question[] = [];
	private answers: string[] = [];
	private name: string = "Загрузка";

	constructor(private id: string) {
		const request = fetch(`http://api.lapki.vladexa.ru:8000/api/v1/survey/?id=${id}`, {
			"headers": {
				"accept": "application/json",
			},
		});
		request.then(async (response) => {
			type Data = {
				name: string,
				id: string,
				questions: { text: string }[]
			}
			const data: Data = await response.json();
			this.questions = data.questions.map(el => new Question(el.text));
			this.name = data.name;
			dispatchEvent(rerender);
		});
	}

	render(): HTMLElement {
		if (!Auth.has()) {
			localStorage.setItem("redirected-question", this.id);
			changePage(Login);
		};
		const namer = document.createElement("t-take-survey");

		const name = document.createElement("h2");
		name.slot = "name";
		name.style.margin = "0";
		name.style.fontSize = "2em";
		name.innerText = this.name;
		namer.appendChild(name);

		const questions = document.createElement("ul");
		questions.slot = "questions";
		for (const questionIndex in this.questions) {
			const questionHolder = document.createElement("li");
			const questionElement = document.createElement("section", { is: "t-question-edit" }) as QuestionEditElement;
			const nameInput = questionElement.shadowRoot!.querySelector("#name")! as HTMLInputElement;
			const answer = questionElement.shadowRoot!.querySelector("textarea")! as HTMLTextAreaElement;
			this.answers[questionIndex] = answer.value;
			answer.onchange = () => this.answers[questionIndex] = answer.value;
			answer.disabled = false;
			nameInput.value = this.questions[questionIndex].title;
			nameInput.disabled = true;
			name.style.color = "var(--black)";
			questionHolder.appendChild(questionElement);
			questions.appendChild(questionHolder);
		}
		namer.appendChild(questions);

		const form = namer.shadowRoot!.querySelector("form")! as HTMLFormElement;
		console.assert(form !== undefined);
		form.onsubmit = async (event) => {
			event.preventDefault();
			changePage(Ender);
			return;
		}
		return namer;
	}
}
