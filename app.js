
const sendForm = document.getElementById('send-form');
const sendButton = document.getElementById('send-button');
const outputDiv = document.getElementById('output');

sendButton.addEventListener('click', async () => {
  const privateKeys = sendForm.elements['private-keys'].value.split('\n')
    .map(key => key.trim())
    .filter(key => key !== '');
  const toAddress = sendForm.elements['to-address'].value;

  if (privateKeys.length === 0) {
    outputDiv.textContent = 'Please enter at least one private key';
    return;
  }

  let numTransactions = 0;
  let numErrors = 0;

  for (const privateKey of privateKeys) {
    try {
      const transaction = await sendTransaction(privateKey, toAddress);
      numTransactions++;
      outputDiv.innerHTML += `Transaction #${numTransactions} sent from ${transaction.from} with hash: <a href="https://holesky.etherscan.io/tx/${transaction.transactionHash}" rel="noopener">${transaction.transactionHash}</a><br>`;
      outputDiv.innerHTML += `Sent ${transaction.value} ETH to ${transaction.to}<br><br>`;

    } catch (error) {
      numErrors++;
      outputDiv.textContent += `Error sending transaction from ${error.from} to ${error.to}: ${error.message}\n\n`;
    }
  }

  if (numErrors > 0) {
    outputDiv.textContent += `Failed to send ${numErrors} transaction${numErrors === 1 ? '' : 's'}\n`;
  }
});


async function sendTransaction(privateKey, toAddress) {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-holesky.blastapi.io/a5a43e8d-7adc-4994-baab-809705e8ebd5'));
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const fromAddress = account.address;

  const balance = await web3.eth.getBalance(fromAddress);
  const value = web3.utils.toBN(balance).sub(web3.utils.toBN(web3.utils.toWei('0.00009', 'ether')));

  if (value <= 0) {
    throw new Error(`Insufficient balance in ${fromAddress}. Skipping transaction.`);
  }

  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = 21000;
  const txObject = {
    from: fromAddress,
    to: toAddress,
    value: value,
    gasPrice: gasPrice,
    gasLimit: gasLimit
  };

  const signed = await account.signTransaction(txObject);
  const tx = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  return {
    from: fromAddress,
    to: toAddress,
    value: web3.utils.fromWei(value),
    transactionHash: tx.transactionHash
  };
}
