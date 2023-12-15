import { Renderable } from "./utils";

export class SurveyId implements Renderable {
    constructor(private id: string) { }

    render(): HTMLElement {
        history.pushState({ id: this.id }, "", "survey-end");
        const link = `${location.origin}/survey-take?id=${this.id}`;
        const surveyId = document.createElement("t-survey-id");
        {
            const id = document.createElement("span");
            id.slot = "link";
            id.appendChild(document.createTextNode(link));
            id.className = "survey-link";
            surveyId.appendChild(id);
        }

        setTimeout(() => 
        navigator.clipboard.writeText(link).then(() => {
            const link = document.createElement("span");
            link.slot = "copied";
            link.appendChild(document.createTextNode("Ссылка уже в вашем буфере обмена"));
            link.className = "copied-text";
            surveyId.appendChild(link);
        }), 0);

        return surveyId;
    }
}
