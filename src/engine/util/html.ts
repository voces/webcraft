const HTMLElement = globalThis.HTMLElement || class {};

export const emptyElement = (element: HTMLElement): void => {
	while (
		element.firstChild &&
		element.firstChild instanceof HTMLElement &&
		element.removeChild(element.firstChild)
	);
};
