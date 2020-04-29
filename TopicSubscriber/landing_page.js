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
 * Publish/Subscribe tutorial - Topic Subscriber
 * Demonstrates subscribing to a topic for direct messages and receiving messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/
let table, subscriber, subNotice;
window.onload = function () {
	// Initialize factory with the most recent API defaults
	var factoryProps = new solace.SolclientFactoryProperties();
	factoryProps.profile = solace.SolclientFactoryProfiles.version10;
	solace.SolclientFactory.init(factoryProps);

	// enable logging to JavaScript console at WARN level
	// NOTICE: works only with "solclientjs-debug.js"
	solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

	// create the subscriber, specifying name of the subscription topic
	var topic_name = "t2/match/>";
	subscriber = new TopicSubscriber(topic_name);
	subNotice = new TopicSubscriber("notice");
	var topic_name_txt = document.getElementById("topic_name");
	topic_name_txt.innerHTML = topic_name;
	// assign buttons to the subscriber functions
	document
		.getElementById("connect")
		.addEventListener("click", subscriber.connect);
	document
		.getElementById("disconnect")
		.addEventListener("click", subscriber.disconnect);
	document
		.getElementById("subscribe")
		.addEventListener("click", subscriber.subscribe);
	document
		.getElementById("unsubscribe")
		.addEventListener("click", subscriber.unsubscribe);

	table = $("#odd_table").DataTable({ select: true });
	table.on("click", "tr", function () {
		var data = table.row(this).data();
		console.log("You clicked on " + data[0] + "'s row");
	});

	// For Testing
	subscriber.connect();
	setTimeout(() => {
		subscriber.subscribe();
	}, 500);
	subNotice.connect();
	setTimeout(() => {
		subNotice.subscribe();
	}, 500);
};

function iframeloaded() {
	if (subscriber) {
		subscriber.connectToSolace();
	}
}

var TopicSubscriber = function (topicName) {
	"use strict";
	var subscriber = {};
	subscriber.session = null;
	subscriber.topicName = topicName;
	subscriber.subscribed = false;

	// result
	// subscriber.result = function (number_arr) {
	// 	// alert(document.getElementById("test").innerHTML)
	// 	console.log(number_arr);
	// 	var i;
	// 	for (i in number_arr) {
	// 		var td_add = document.getElementById("result-num-" + i);
	// 		td_add.innerHTML = number_arr[i];
	// 		var td_pic = document.getElementById("result-pic-" + i);
	// 		td_pic.src = `./marksix_ball/${number_arr[i]}.gif`;
	// 	}
	// };
	// push odd
	subscriber.tableClear = function () {
		table.clear().draw();
	};
	subscriber.push_odd = function (match) {
		let {
			matchID,
			homeTeam,
			awayTeam,
			matchStatus,
			pool,
			lastupdated,
		} = match;
		let datas = table
			.rows()
			.data()
			.map((y, index) => {
				return {
					index,
					matchID: y[0],
					homeTeam: y[1],
					awayTeam: y[2],
					matchStatus: y[3],
					poolcode: y[4],
					poolID: y[5],
					lastupdated: y[6],
				};
			})
			.toArray();
		// console.log(datas)

		pool.forEach((x) => {
			let existing_res = datas.filter((y) => {
				return y.matchID == matchID && y.poolcode == x.poolcode;
			});
			if (existing_res.length) {
				// console.log([existing_res[0].matchID, existing_res[0].poolcode, existing_res[0].poolID, existing_res[0].matchStatus], " => ", [matchID.toString(), x.poolcode, x.poolID, matchStatus])
				table
					.row(existing_res[0].index)
					.data([
						matchID,
						homeTeam,
						awayTeam,
						matchStatus,
						x.poolcode,
						x.poolID,
						lastupdated,
					])
					.draw(false);
			} else {
				table.row
					.add([
						matchID,
						homeTeam,
						awayTeam,
						matchStatus,
						x.poolcode,
						x.poolID,
						lastupdated,
					])
					.draw(false);
			}
		});
	};
	// Logger
	subscriber.log = function (line) {
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

	subscriber.log(
		'\n*** Subscriber to topic "' +
			subscriber.topicName +
			'" is ready to connect ***'
	);

	// Establishes connection to Solace router
	subscriber.connect = function () {
		// extract params
		if (subscriber.session !== null) {
			subscriber.log("Already connected and ready to subscribe.");
			return;
		}
		// var hosturl = document.getElementById('hosturl').value;
		var hosturl = "wss://mr22gx8ufrq5gb.messaging.solace.cloud:20068";
		// var hosturl = 'http://mr22gx8ufrq5gb.messaging.solace.cloud:20074';
		// check for valid protocols
		if (
			hosturl.lastIndexOf("ws://", 0) !== 0 &&
			hosturl.lastIndexOf("wss://", 0) !== 0 &&
			hosturl.lastIndexOf("http://", 0) !== 0 &&
			hosturl.lastIndexOf("https://", 0) !== 0
		) {
			subscriber.log(
				"Invalid protocol - please use one of ws://, wss://, http://, https://"
			);
			return;
		}
		// var username = document.getElementById('username').value;
		// var pass = document.getElementById('password').value;
		// var vpn = document.getElementById('message-vpn').value;
		var username = "solace-cloud-client";
		var pass = "2gm0hhma6e04asa27coorhsvp0";
		var vpn = "msgvpn-22gx8ufrtvhl";
		if (!hosturl || !username || !pass || !vpn) {
			subscriber.log(
				"Cannot connect: please specify all the Solace message router properties."
			);
			return;
		}
		subscriber.log(
			"Connecting to Solace message router using url: " + hosturl
		);
		subscriber.log("Client username: " + username);
		subscriber.log("Solace message router VPN name: " + vpn);
		// create session
		try {
			subscriber.session = solace.SolclientFactory.createSession({
				// solace.SessionProperties
				url: hosturl,
				vpnName: vpn,
				userName: username,
				password: pass,
			});
		} catch (error) {
			subscriber.log(error.toString());
		}
		// define session event listeners
		subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function (
			sessionEvent
		) {
			subscriber.log(
				"=== Successfully connected and ready to subscribe. ==="
			);
		});
		subscriber.session.on(
			solace.SessionEventCode.CONNECT_FAILED_ERROR,
			function (sessionEvent) {
				subscriber.log(
					"Connection failed to the message router: " +
						sessionEvent.infoStr +
						" - check correct parameter values and connectivity!"
				);
			}
		);
		subscriber.session.on(solace.SessionEventCode.DISCONNECTED, function (
			sessionEvent
		) {
			subscriber.log("Disconnected.");
			subscriber.subscribed = false;
			if (subscriber.session !== null) {
				subscriber.session.dispose();
				subscriber.session = null;
			}
		});
		subscriber.session.on(
			solace.SessionEventCode.SUBSCRIPTION_ERROR,
			function (sessionEvent) {
				subscriber.log(
					"Cannot subscribe to topic: " + sessionEvent.correlationKey
				);
			}
		);
		subscriber.session.on(
			solace.SessionEventCode.SUBSCRIPTION_OK,
			function (sessionEvent) {
				if (subscriber.subscribed) {
					subscriber.subscribed = false;
					subscriber.log(
						"Successfully unsubscribed from topic: " +
							sessionEvent.correlationKey
					);
				} else {
					subscriber.subscribed = true;
					subscriber.log(
						"Successfully subscribed to topic: " +
							sessionEvent.correlationKey
					);
					subscriber.log("=== Ready to receive messages. ===");
				}
			}
		);
		// define message event listener
		subscriber.session.on(solace.SessionEventCode.MESSAGE, function (
			message
		) {
			subscriber.log(
				'Received message: "' +
					message.getBinaryAttachment() +
					'", details:\n' +
					message.dump()
			);
			var msg = JSON.parse(message.getBinaryAttachment());
			// console.log(msg.matchStatus, "@@@@@@@@@@@");
			if (msg.clear) {
				subscriber.tableClear();
			} else {
				subscriber.push_odd(msg);
			}
			// if (msg.results){
			//     console.log(msg.results)
			//     subscriber.result(msg.results)
			//     // var x ;
			//     // for (x in msg.results){
			//     //     console.log(x)
			//     //     subscriber.result(msg.results[x])
			//     //     // var td1 = document.getElementById(`result-num-${x}`);
			//     //     // td1.innerHTML = msg.results[x]

			//     //     // var text = document.createTextNode("some text");
			//     //     // td1.appendChild(text);
			//     // }
			// }
		});

		subscriber.connectToSolace();
	};

	// Actually connects the session triggered when the iframe has been loaded - see in html code
	subscriber.connectToSolace = function () {
		try {
			subscriber.session.connect();
		} catch (error) {
			subscriber.log(error.toString());
		}
	};

	// Subscribes to topic on Solace message router
	subscriber.subscribe = function () {
		if (subscriber.session !== null) {
			if (subscriber.subscribed) {
				subscriber.log(
					'Already subscribed to "' +
						subscriber.topicName +
						'" and ready to receive messages.'
				);
			} else {
				subscriber.log("Subscribing to topic: " + subscriber.topicName);
				try {
					subscriber.session.subscribe(
						solace.SolclientFactory.createTopicDestination(
							subscriber.topicName
						),
						true, // generate confirmation when subscription is added successfully
						subscriber.topicName, // use topic name as correlation key
						10000 // 10 seconds timeout for this operation
					);
				} catch (error) {
					subscriber.log(error.toString());
				}
			}
		} else {
			subscriber.log(
				"Cannot subscribe because not connected to Solace message router."
			);
		}
	};

	// Unsubscribes from topic on Solace message router
	subscriber.unsubscribe = function () {
		if (subscriber.session !== null) {
			if (subscriber.subscribed) {
				subscriber.log(
					"Unsubscribing from topic: " + subscriber.topicName
				);
				try {
					subscriber.session.unsubscribe(
						solace.SolclientFactory.createTopicDestination(
							subscriber.topicName
						),
						true, // generate confirmation when subscription is removed successfully
						subscriber.topicName, // use topic name as correlation key
						10000 // 10 seconds timeout for this operation
					);
				} catch (error) {
					subscriber.log(error.toString());
				}
			} else {
				subscriber.log(
					'Cannot unsubscribe because not subscribed to the topic "' +
						subscriber.topicName +
						'"'
				);
			}
		} else {
			subscriber.log(
				"Cannot unsubscribe because not connected to Solace message router."
			);
		}
	};

	// Gracefully disconnects from Solace message router
	subscriber.disconnect = function () {
		subscriber.log("Disconnecting from Solace message router...");
		if (subscriber.session !== null) {
			try {
				subscriber.session.disconnect();
			} catch (error) {
				subscriber.log(error.toString());
			}
		} else {
			subscriber.log("Not connected to Solace message router.");
		}
	};

	return subscriber;
};
