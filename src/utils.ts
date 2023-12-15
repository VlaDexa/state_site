export interface Renderable {
	render(): HTMLElement;
}

export interface RenderableConstructor<T extends unknown[]> {
	new(...a: T): Renderable
}

export type ChangePageDetail<T extends unknown[]> = {
	page: RenderableConstructor<T>,
	data: T,
}

export function changePage<Data extends unknown[]>(page: RenderableConstructor<Data>, ...data: Data) {
	const rerender_page = new CustomEvent("change-page", {
		detail: {
			page,
			data,
		} satisfies ChangePageDetail<Data>,
	});
	dispatchEvent(rerender_page);
	dispatchEvent(rerender);
}

export const rerender = new Event('rerender');
