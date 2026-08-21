import { describe, it, expect } from "vitest";
import { buildUnsubscribeUrl, appendUnsubscribeFooter } from "./unsubscribe-link";

describe("buildUnsubscribeUrl", () => {
  it("builds a URL keyed on the customer's token and the channel", () => {
    const url = buildUnsubscribeUrl({ unsubscribeToken: "tok_abc123" }, "EMAIL");
    expect(url).toContain("/unsubscribe/tok_abc123");
    expect(url).toContain("c=EMAIL");
  });
});

describe("appendUnsubscribeFooter", () => {
  it("appends the footer with a working link, once, in French", () => {
    const body = "Bonjour, voici un suivi.";
    const url = "http://localhost:3000/unsubscribe/tok_abc123?c=EMAIL";
    const result = appendUnsubscribeFooter(body, url, "FR");

    expect(result.startsWith(body)).toBe(true);
    expect(result).toContain(url);
    expect(result.split(url)).toHaveLength(2); // the URL appears exactly once
  });

  it("appends the footer with a working link, once, in English", () => {
    const body = "Hi, here's a follow-up.";
    const url = "http://localhost:3000/unsubscribe/tok_abc123?c=EMAIL";
    const result = appendUnsubscribeFooter(body, url, "EN");

    expect(result.startsWith(body)).toBe(true);
    expect(result).toContain(url);
    expect(result.split(url)).toHaveLength(2);
  });
});
