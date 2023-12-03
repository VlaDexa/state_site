export default class QuestionEditElement extends HTMLElement {
	constructor(public questionName: string = "Название вопроса") {
		super();
		const template = document.getElementById("question-editor") as HTMLTemplateElement;
		this.attachShadow({ mode: "open" });
		this.shadowRoot!.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		const nameElement = this.shadowRoot!.getElementById("name") as HTMLInputElement;
		const change = new Event('change');
		nameElement.onchange = () => {
			this.questionName = nameElement.value;
			this.dispatchEvent(change);
		};
	}
}
