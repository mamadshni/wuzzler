import { describe, expect, it } from "vitest";
import { isPartialRequest } from "./routing";

describe("isPartialRequest", () => {
	it("returns true when hx-request=true and hx-boosted is not set", () => {
		const req = {
			headers: {
				"hx-request": "true",
			},
		};

		expect(isPartialRequest(req)).toBe(true);
	});

	it("returns true when hx-request=true and hx-boosted=false", () => {
		const req = {
			headers: {
				"hx-request": "true",
				"hx-boosted": "false",
			},
		};

		expect(isPartialRequest(req)).toBe(true);
	});

	it("returns false when hx-request=true and hx-boosted=true", () => {
		const req = {
			headers: {
				"hx-request": "true",
				"hx-boosted": "true",
			},
		};

		expect(isPartialRequest(req)).toBe(false);
	});

	it("returns false when hx-request is not set", () => {
		const req = {
			headers: {},
		};

		expect(isPartialRequest(req)).toBe(false);
	});

	it("returns false when hx-request=false", () => {
		const req = {
			headers: {
				"hx-request": "false",
			},
		};

		expect(isPartialRequest(req)).toBe(false);
	});

	it("returns false when hx-request is empty string", () => {
		const req = {
			headers: {
				"hx-request": "",
			},
		};

		expect(isPartialRequest(req)).toBe(false);
	});

	it("returns false when hx-request has different casing", () => {
		const req = {
			headers: {
				"hx-request": "True",
			},
		};

		expect(isPartialRequest(req)).toBe(false);
	});

	it("returns false when hx-boosted=true overrides hx-request=true (boosted navigation)", () => {
		const req = {
			headers: {
				"hx-request": "true",
				"hx-boosted": "true",
			},
		};

		expect(isPartialRequest(req)).toBe(false);
	});

	it("handles requests with additional headers", () => {
		const req = {
			headers: {
				"hx-request": "true",
				"user-agent": "Mozilla/5.0",
				accept: "text/html",
			},
		};

		expect(isPartialRequest(req)).toBe(true);
	});

	it("returns false when hx-request=true and hx-boosted is any other value", () => {
		const req = {
			headers: {
				"hx-request": "true",
				"hx-boosted": "yes",
			},
		};

		expect(isPartialRequest(req)).toBe(true);
	});
});
