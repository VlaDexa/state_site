interface Renderable {
	render(): HTMLElement;
}
interface RenderableConstructor<T extends unknown[]> {
	new(...a: T): Renderable
}

function changePage<Data extends unknown[]>(page: RenderableConstructor<Data>, ...data: Data) {
	const rerender_page = new CustomEvent("change-page", {
		detail: {
			page,
			data,
		},
	});
	dispatchEvent(rerender_page);
	dispatchEvent(rerender);
}
const rerender = new Event('rerender');

class QuestionEditElement extends HTMLElement {
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
			this.dispatchEvent(change)
		};
	}
}

class Auth {
	private constructor(private type: string, private token: string) { }

	public static fromStorage(): Auth | undefined {
		const type = localStorage.getItem("token_type");
		const token = localStorage.getItem("access_token");
		if (type && token) {
			return new Auth(type, token);
		}
		return undefined;
	}

	public static has(): boolean {
		const type = localStorage.getItem("token_type");
		const token = localStorage.getItem("access_token");
		return Boolean(type && token);
	}

	public toAuthorization(): string {
		return `${this.type[0].toUpperCase() + this.type.slice(1)} ${this.token}`;
	}
}

function getAuth(): string {
	const auth = Auth.fromStorage();
	if (auth) {
		return auth.toAuthorization();
	} else {
		return "";
	}
}

class Login implements Renderable {
	constructor() { }
	render(): HTMLElement {
		const login = document.createElement("t-login");
		const form = login.shadowRoot!.getElementById('login-form')! as HTMLFormElement;
		form.onsubmit = async (event) => {
			event.preventDefault();
			const data = new FormData(form);
			const email = data.get('email')!;
			const password = data.get('password')!;
			const login_url = "http://api.lapki.vladexa.ru:8000/api/v1/user/token";
			const login_data = {
				"headers": {
					"content-type": "application/x-www-form-urlencoded",
				},
				"body": `grant_type=&username=${email}&password=${password}&scope=&client_id=&client_secret=`,
				"method": "POST",
			};
			const login = () => fetch(login_url, login_data);
			let req = await login();
			if (req.status !== 200) {
				const register_url = "http://api.lapki.vladexa.ru:8000/api/v1/user/users";
				const register_data = {
					"headers": {
						"content-type": "application/json",
					},
					"body": `{"nickname":"${email}","password": "${password}"}`,
					"method": "POST",
				};
				await fetch(register_url, register_data);
				req = await login();
			};
			const log_data = await req.json();
			localStorage.setItem("name", email.toString());
			for (const [key, value] of Object.entries(log_data)) {
				localStorage.setItem(key, value as string);
			}
			changePage(SurveyNamer);
		};
		history.pushState(undefined, "", "login");
		return login;
	}
}

class SurveyNamer implements Renderable {
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
			event.preventDefault()
			const data = new FormData(form);
			const name = data.get("name")!;
			const expire = data.get("date")!;
			const auth = getAuth();
			if (!auth)
				return location.replace("/login");
			const req = await fetch("http://api.lapki.vladexa.ru:8000/api/v1/survey", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": auth,
				},
				body: `{"name":"${name}","expire_at":"${expire}"}`
			});
			if (req.status !== 200) return alert("Error at creation");
			changePage(Survey, name.toString());
		}
		return namer;
	}
}

class Question {
	constructor(public title: string = "Новый вопрос") { }
}

class Survey implements Renderable {
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


class End implements Renderable {
	render(): HTMLElement {
		return document.createElement("div");
	}
}

declare interface Document extends DocumentViewTransition { }

declare interface DocumentViewTransition {
	/** @see https://drafts.csswg.org/css-view-transitions/#additions-to-document-api */
	startViewTransition?(updateCallback?: UpdateCallback): ViewTransition;
}

/** @see https://drafts.csswg.org/css-view-transitions/#viewtransition */
interface ViewTransition {
	readonly updateCallbackDone: Promise<void>;
	readonly ready: Promise<void>;
	readonly finished: Promise<void>;

	skipTransition(): void;
}

type UpdateCallback = () => Promise<void>;

class StateMachine implements Renderable {
	private state: Renderable;

	constructor() {
		switch (location.pathname) {
			case "/login":
				this.state = new Login();
				break;
			case "/survey":
				this.state = new Survey(history.state?.name ?? "None");
				break;
			default:
				this.state = Auth.has() ? new SurveyNamer() : new Login();
				break;
		}
		addEventListener(rerender.type, () => {
			if (document.startViewTransition) {
				document.startViewTransition(async () => root.replaceChildren(state.render()));
			} else {
				root.replaceChildren(state.render())
			}
		}
		);
		addEventListener("change-page", (e) => {
			const event = e as CustomEvent;
			const page = event.detail.page as RenderableConstructor<unknown[]>;
			const data = event.detail.data;
			this.state = new page(...data);
		});
	}

	render(): HTMLElement {
		return this.state.render();
	}
}

const state = new StateMachine();
let root: HTMLElement;

function defineCustomElement(template_id: string, name: string) {
	customElements.define(
		name,
		class extends HTMLElement {
			constructor() {
				super();
				const template = (document.getElementById(
					template_id,
				) as HTMLTemplateElement
				).content;
				const shadowRoot = this.attachShadow({ mode: "open" });
				shadowRoot.appendChild(template.cloneNode(true));
			}
		},
	);
}
defineCustomElement("login", "t-login");
defineCustomElement("survey-namer", "t-survey-namer");
defineCustomElement("survey", "t-survey");
customElements.define(
	"t-header",
	class extends HTMLElement {
		constructor() {
			super();
			const template = (document.getElementById(
				"logged-in-header",
			) as HTMLTemplateElement
			).content;
			this.attachShadow({ mode: "open" });
			this.shadowRoot!.appendChild(template.cloneNode(true));
		}
		connectedCallback() {
			this.shadowRoot!.getElementById("name")!.innerText = localStorage.getItem('name')!;
		}
	},
	{ extends: "header" }
);
customElements.define("t-question-edit",
	QuestionEditElement,
	{ extends: "section" }
)

addEventListener('load', () => {
	root = document.getElementById('root')!;
	dispatchEvent(rerender);
}, { once: true });
