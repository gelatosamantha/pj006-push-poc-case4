/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Solace Web Messaging API for JavaScript
 * Publish/Subscribe tutorial - Topic Publisher
 * Demonstrates publishing direct messages to a topic
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var publisher = null;

// window.onload = function () {
// 	// Initialize factory with the most recent API defaults
// 	var factoryProps = new solace.SolclientFactoryProperties();
// 	factoryProps.profile = solace.SolclientFactoryProfiles.version10;
// 	solace.SolclientFactory.init(factoryProps);

// 	// enable logging to JavaScript console at WARN level
// 	// NOTICE: works only with "solclientjs-debug.js"
// 	solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

// 	// publisher = new TopicPublisher(messagesA[0].topic); //######
// 	// assign buttons to the publisher functions
// 	// document.getElementById("connect").addEventListener("click", publisher.connect);
// 	// document.getElementById("disconnect").addEventListener("click", publisher.disconnect);
// 	// document
// 	// .getElementById("publish_a")
// 	// .addEventListener("click", this.start("publish_a"));
// 	$("#publish_a").click(start);
// 	$("#publish_b").click(start);
// 	$("#publish_c").click(start);
// 	// .addEventListener("click", start(messagesA));

// 	// document
// 	// 	.getElementById("publish_b")
// 	// 	.addEventListener("click", start(messagesB));
// 	// document
// 	// 	.getElementById("publish_c")
// 	// 	.addEventListener("click", start(messagesC));

// 	// publisher.connect();
// };
$(document).ready(() => {
	// Initialize factory with the most recent API defaults
	var factoryProps = new solace.SolclientFactoryProperties();
	factoryProps.profile = solace.SolclientFactoryProfiles.version10;
	solace.SolclientFactory.init(factoryProps);

	// enable logging to JavaScript console at WARN level
	// NOTICE: works only with "solclientjs-debug.js"
	solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

	$("#publish_a").click(start);
	$("#publish_b").click(start);
	$("#publish_c").click(start);
	$("#notify").click(sendNoti);
});

function iframeloaded() {
	if (publisher) {
		publisher.connectToSolace();
	}
}
function start(e) {
	let messages_arr;
	console.log(e.target);
	if (e.target.id == "publish_a") {
		messages_arr = messagesA;
	} else if (e.target.id == "publish_b") {
		messages_arr = messagesB;
	} else if (e.target.id == "publish_c") {
		messages_arr = messagesC;
	}
	let pub_promise_arr = [];
	messages_arr.forEach((x) => {
		pub_promise_arr.push(pubto(x.topic, x.payload));
	});
	Promise.all(pub_promise_arr);
}
function pubto(topic, msg) {
	let publisher = new TopicPublisher(topic);
	publisher.connect();
	setTimeout(() => {
		publisher.publish(JSON.stringify(msg));
	}, 2000);
}
function sendNoti(e) {
	pubto("notice", { clear: true });
}
var TopicPublisher = function (topicName) {
	"use strict";
	var publisher = {};
	publisher.session = null;
	publisher.topicName = topicName;

	// Logger
	publisher.log = function (line) {
		var now = new Date();
		var time = [
			("0" + now.getHours()).slice(-2),
			("0" + now.getMinutes()).slice(-2),
			("0" + now.getSeconds()).slice(-2),
		];
		var timestamp = "[" + time.join(":") + "] ";
		console.log(timestamp + line);
		var logTextArea = document.getElementById("log");
		logTextArea.value += timestamp + line + "\n";
		logTextArea.scrollTop = logTextArea.scrollHeight;
	};

	publisher.log(
		'\n*** Publisher to topic "' +
			publisher.topicName +
			'" is ready to connect ***'
	);

	// Establishes connection to Solace message router
	publisher.connect = function () {
		// extract params
		if (publisher.session !== null) {
			publisher.log("Already connected and ready to publish messages.");
			return;
		}
		var hosturl = config.hosturl;
		// check for valid protocols
		if (
			hosturl.lastIndexOf("ws://", 0) !== 0 &&
			hosturl.lastIndexOf("wss://", 0) !== 0 &&
			hosturl.lastIndexOf("http://", 0) !== 0 &&
			hosturl.lastIndexOf("https://", 0) !== 0
		) {
			publisher.log(
				"Invalid protocol - please use one of ws://, wss://, http://, https://"
			);
			return;
		}
		var username = config.username;
		var pass = config.pass;
		var vpn = config.vpn;
		if (!hosturl || !username || !pass || !vpn) {
			publisher.log(
				"Cannot connect: please specify all the Solace message router properties."
			);
			return;
		}
		publisher.log(
			"Connecting to Solace message router using url: " + hosturl
		);
		publisher.log("Client username: " + username);
		publisher.log("Solace message router VPN name: " + vpn);
		// create session
		try {
			publisher.session = solace.SolclientFactory.createSession({
				// solace.SessionProperties
				url: hosturl,
				vpnName: vpn,
				userName: username,
				password: pass,
			});
		} catch (error) {
			publisher.log(error.toString());
		}
		// define session event listeners
		publisher.session.on(solace.SessionEventCode.UP_NOTICE, function (
			sessionEvent
		) {
			publisher.log(
				"=== Successfully connected and ready to publish messages. ==="
			);
		});
		publisher.session.on(
			solace.SessionEventCode.CONNECT_FAILED_ERROR,
			function (sessionEvent) {
				publisher.log(
					"Connection failed to the message router: " +
						sessionEvent.infoStr +
						" - check correct parameter values and connectivity!"
				);
			}
		);
		publisher.session.on(solace.SessionEventCode.DISCONNECTED, function (
			sessionEvent
		) {
			publisher.log("Disconnected.");
			if (publisher.session !== null) {
				publisher.session.dispose();
				publisher.session = null;
			}
		});

		publisher.connectToSolace();
	};

	// Actually connects the session triggered when the iframe has been loaded - see in html code
	publisher.connectToSolace = function () {
		try {
			publisher.session.connect();
		} catch (error) {
			publisher.log(error.toString());
		}
	};

	// Publishes one message
	publisher.publish = function (msg) {
		if (publisher.session !== null) {
			var messageText = msg;
			var message = solace.SolclientFactory.createMessage();
			message.setDestination(
				solace.SolclientFactory.createTopicDestination(
					publisher.topicName
				)
			);
			message.setBinaryAttachment(messageText);
			message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
			publisher.log(
				'Publishing message "' +
					messageText +
					'" to topic "' +
					publisher.topicName +
					'"...'
			);
			try {
				publisher.session.send(message);
				publisher.log("Message published.");
			} catch (error) {
				publisher.log(error.toString());
			}
		} else {
			publisher.log(
				"Cannot publish because not connected to Solace message router."
			);
		}
	};

	// Gracefully disconnects from Solace message router
	publisher.disconnect = function () {
		publisher.log("Disconnecting from Solace message router...");
		if (publisher.session !== null) {
			try {
				publisher.session.disconnect();
			} catch (error) {
				publisher.log(error.toString());
			}
		} else {
			publisher.log("Not connected to Solace message router.");
		}
	};

	return publisher;
};
