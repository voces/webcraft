import { h } from "preact";
import { mount } from "enzyme";

import { Game as GameC } from "../contexts/Game";

import { Ping } from "./Ping";
import { fakeGame } from "../tests/fake/FakeGame";
import { Network } from "../../../network";

it("works", () => {
	const network = new Network();
	const wrapper = mount(
		<GameC.Provider value={fakeGame({ network })}>
			<Ping />
		</GameC.Provider>,
	);

	network.dispatchEvent("ping", {
		type: "ping",
		eventType: "chat",
		ping: 3,
	});
	network.dispatchEvent("ping", {
		type: "ping",
		eventType: "chat",
		ping: 7,
	});
	network.dispatchEvent("ping", {
		type: "ping",
		eventType: "build",
		ping: 5,
	});
	network.dispatchEvent("ping", {
		type: "ping",
		eventType: "move",
		ping: 8,
	});
	network.dispatchEvent("ping", {
		type: "ping",
		eventType: "move",
		ping: 4,
	});
	network.dispatchEvent("ping", {
		type: "ping",
		eventType: "build",
		ping: 6,
	});

	wrapper.update();

	expect(wrapper.text()).toEqual("6.0ms");
	expect(wrapper.find("span").prop("title")).toEqual(
		[
			"build: 6.0ms",
			"move: 4.0ms",
			"move: 8.0ms",
			"build: 5.0ms",
			"chat: 7.0ms",
		].join("\n"),
	);
});
