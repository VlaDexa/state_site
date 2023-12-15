import Auth from "./Auth";
import Login from "./Login";
import QuestionEditElement from "./QuestionEditElement";
import Survey from "./Survey";
import SurveyNamer from "./SurveyNamer";
import TakeSurvey from "./TakeSurvey";
import { Renderable, RenderableConstructor, rerender } from "./utils";

declare global {
	interface Document extends DocumentViewTransition { }

	interface DocumentViewTransition {
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
}

class StateMachine implements Renderable {
	private state: Renderable;

	constructor() {
		switch (location.pathname) {
			case "/survey-take":
				const url = new URL(location.href);
				const id = url.searchParams.get("id")!;
				this.state = new TakeSurvey(id);
				break;
			case "/login":
				this.state = new Login();
				break;
			case "/survey":
				this.state = new Survey(history.state?.name ?? "None", "None, lol");
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
				const template_elem = document.getElementById(
					template_id,
				) as HTMLTemplateElement;
				const template = template_elem.content;
				const shadowRoot = this.attachShadow({ mode: "open" });
				shadowRoot.appendChild(template.cloneNode(true));
			}
		},
	);
}
defineCustomElement("login", "t-login");
defineCustomElement("survey-namer", "t-survey-namer");
defineCustomElement("survey", "t-survey");
defineCustomElement("survey-id", "t-survey-id");
defineCustomElement("take-survey", "t-take-survey");
defineCustomElement("ender", "t-ender");
customElements.define(
	"t-header",
	class extends HTMLElement {
		constructor() {
			super();
			const template_elem = document.getElementById(
				"logged-in-header",
			) as HTMLTemplateElement;
			const template = template_elem.content;
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
