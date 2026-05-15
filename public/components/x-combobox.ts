/**
 * <x-combobox> — form-associated autocomplete input
 *
 * Attributes:
 *   name        (required) — form field name
 *   data-source (required) — URL prefix; query is appended as ?q=<encoded>
 *   placeholder — forwarded to the inner input
 *   required    — forwarded to internals.setValidity
 *
 * Events:
 *   change — dispatched (bubbles) when the user selects an option
 *
 * The server should return <li role="option" data-value="id">Label</li> fragments
 * for GET <data-source>?q=<query>.
 */

class XCombobox extends HTMLElement {
	static formAssociated = true;

	#internals: ElementInternals;
	#input: HTMLInputElement;
	#listbox: HTMLUListElement;
	#activeIndex = -1;
	#options: HTMLLIElement[] = [];
	#uid: string;

	constructor() {
		super();
		this.#internals = this.attachInternals();
		this.#uid = `lb-${Math.random().toString(36).slice(2)}`;

		// Create input
		this.#input = document.createElement("input");
		this.#input.setAttribute("role", "combobox");
		this.#input.setAttribute("aria-autocomplete", "list");
		this.#input.setAttribute("aria-expanded", "false");
		this.#input.setAttribute("aria-controls", this.#uid);
		this.#input.setAttribute("autocomplete", "off");

		// Create listbox
		this.#listbox = document.createElement("ul");
		this.#listbox.id = this.#uid;
		this.#listbox.setAttribute("role", "listbox");
		this.#listbox.hidden = true;

		this.appendChild(this.#input);
		this.appendChild(this.#listbox);
	}

	connectedCallback() {
		// Forward attributes
		const placeholder = this.getAttribute("placeholder");
		if (placeholder) {
			this.#input.placeholder = placeholder;
		}

		this.#input.addEventListener("input", () => this.#onInput());
		this.#input.addEventListener("keydown", (e) => this.#onKeydown(e));
		this.#input.addEventListener("blur", () => this.#close());
		this.#listbox.addEventListener("mousedown", (e) => {
			e.preventDefault(); // prevent blur before click
			const li = (e.target as Element).closest("li");
			if (li) this.#select(li as HTMLLIElement);
		});
	}

	async #onInput() {
		const q = this.#input.value.trim();
		if (!q) {
			this.#close();
			return;
		}

		const src = this.getAttribute("data-source");
		if (!src) return;

		try {
			const res = await fetch(`${src}?q=${encodeURIComponent(q)}`);
			const html = await res.text();
			this.#listbox.innerHTML = html;
			this.#options = Array.from(this.#listbox.querySelectorAll("li"));
			this.#activeIndex = -1;
			this.#listbox.hidden = this.#options.length === 0;
			this.#input.setAttribute("aria-expanded", String(!this.#listbox.hidden));
		} catch {
			this.#close();
		}
	}

	#onKeydown(e: KeyboardEvent) {
		if (this.#listbox.hidden) return;
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				this.#move(1);
				break;
			case "ArrowUp":
				e.preventDefault();
				this.#move(-1);
				break;
			case "Enter":
				e.preventDefault();
				if (this.#activeIndex >= 0) {
					const opt = this.#options[this.#activeIndex];
					if (opt) this.#select(opt);
				}
				break;
			case "Escape":
				this.#close();
				break;
		}
	}

	#move(dir: 1 | -1) {
		const n = this.#options.length;
		if (!n) return;
		if (this.#activeIndex === -1) {
			this.#activeIndex = dir === 1 ? 0 : n - 1;
		} else {
			this.#activeIndex = (this.#activeIndex + dir + n) % n;
		}
		this.#options.forEach((li, i) => {
			li.setAttribute("aria-selected", String(i === this.#activeIndex));
		});
		const active = this.#options[this.#activeIndex];
		if (active) {
			if (!active.id) active.id = `${this.#uid}-opt-${this.#activeIndex}`;
			this.#input.setAttribute("aria-activedescendant", active.id);
		}
	}

	#select(li: HTMLLIElement) {
		const value = li.dataset.value ?? "";
		const label = li.textContent?.trim() ?? "";
		this.#input.value = label;
		this.#internals.setFormValue(value);
		this.dispatchEvent(new Event("change", { bubbles: true }));
		this.#close();
	}

	#close() {
		this.#listbox.hidden = true;
		this.#listbox.innerHTML = "";
		this.#options = [];
		this.#activeIndex = -1;
		this.#input.setAttribute("aria-expanded", "false");
		this.#input.removeAttribute("aria-activedescendant");
	}
}

customElements.define("x-combobox", XCombobox);
