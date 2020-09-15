import React, { useState, useEffect } from "react";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import "./VoteScreen.css";
import { Button } from "@material-ui/core";
import getWeb3 from "./utils/getWeb3";
import voteContractAbi from "./abi/voteContractJson.json";

import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
function Alert(props) {
	return <MuiAlert elevation={6} variant="filled" {...props} />;
}
const VoteScreen = () => {
	const [web3, setWeb3] = useState(null);
	const [voteContract, setVoteContract] = useState(null);
	const [curAccount, setCurAccount] = useState(null);
	const [selectedParty, setSelectedParty] = useState("BJP");
	const [openSuccess, setOpenSuccess] = useState(false);
	const [openError, setOpenError] = useState(false);
	const [parties, setParties] = useState({
		BJP: 0,
		AAP: 0,
		Congress: 0,
		NOTA: 0,
	});

	const setEventListeners = async (_voteContract, _web3, _curAccount) => {
		_voteContract.events.voteRecorded({ fromBlock: 0 }, function (
			error,
			event
		) {
			if (!error) {
				console.log("return", event.returnValues, "_curAccount", _curAccount);
				if (event.returnValues.voter == _curAccount) {
					setOpenSuccess(true);
				}
			}
		});
	};

	useEffect(async () => {
		try {
			const _web3 = await getWeb3();
			const accounts = await _web3.eth.getAccounts();

			const voteContractInstance = new _web3.eth.Contract(
				voteContractAbi,
				"0x430dcf6bacdabc18ad7d54ca7b51ff83cc13294e"
			);
			console.log(accounts);
			setCurAccount(accounts[0]);

			setVoteContract(voteContractInstance);
			setWeb3(_web3);

			await voteContractInstance.methods
				.getVoteCounts()
				.call({ from: curAccount }, function (err, votes) {
					console.log("votes", votes);
					setParties({
						BJP: parseInt(votes[0]),
						AAP: parseInt(votes[1]),
						Congress: parseInt(votes[2]),
						NOTA: parseInt(votes[3]),
					});
					// partiesObj[key] = parseInt(votes);
				});
			setEventListeners(voteContractInstance, _web3, accounts[0]);
		} catch (error) {
			alert(`Please Install metamask to establish connection with blockchain `);
			console.log("err", error);
			return;
		}
	}, []);
	const handleChange = (event) => {
		setSelectedParty(event.target.value);
	};

	const onVote = () => {
		console.log("selectedParty", selectedParty);
		voteContract.methods
			.vote(selectedParty.toString())
			.send({ from: curAccount })
			.then((err, res) => {
				console.log("requested");
			})
			.catch((e) => {
				console.log("got in err", e);
				setOpenError(true);
				return;
			});
	};
	return (
		<div className="voteScreen">
			<h1>Voting DApp</h1>
			<div className="voteScreen__scores">
				{Object.keys(parties).map((key) => (
					<div className="voteScreen__scoreCard">
						<h3> {key}</h3>
						<h>{parties[key]}</h>
					</div>
				))}
			</div>
			<div className="voteScreen__card">
				<div className="voteScreen__partyPanel">
					<h3>Party</h3>

					<div className="voteScreen__dropDown">
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={selectedParty}
							onChange={handleChange}>
							{Object.keys(parties).map((key) => (
								<MenuItem value={key}>{key}</MenuItem>
							))}
						</Select>
					</div>
				</div>

				<button className="voteScreen__voteButton" onClick={onVote}>
					VOTE
				</button>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					position: "fixed",
					bottom: "10vh",
				}}>
				<h4>My Address</h4>
				<p>{curAccount}</p>
			</div>
			<Snackbar
				open={openSuccess}
				autoHideDuration={12000}
				onClose={() => setOpenSuccess(false)}>
				<Alert onClose={() => setOpenSuccess(false)} severity="success">
					Vote recorded on blockchain
				</Alert>
			</Snackbar>
			<Snackbar
				open={openError}
				autoHideDuration={12000}
				onClose={() => setOpenError(false)}>
				<Alert onClose={() => setOpenError(false)} severity="error">
					Already Voted !
				</Alert>
			</Snackbar>
		</div>
	);
};

export default VoteScreen;
