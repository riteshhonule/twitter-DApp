import contractABI from "./abi.json"; // Ensure abi.json is in src folder

// 2️⃣ Smart contract address
const contractAddress = "0x48d19aD1828D544B148eCC8f97ac3DbA6b466028";

// Initialize Web3
let web3 = new Web3(window.ethereum);

// 3️⃣ Connect to contract
let contract = new web3.eth.Contract(contractABI, contractAddress);

// ✅ Connect MetaMask
async function connectWallet() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setConnected(accounts[0]);
    } catch (error) {
      console.error("User rejected the request:", error);
    }
  } else {
    console.error("No web3 provider detected");
    document.getElementById("connectMessage").innerText =
      "No web3 provider detected. Please install MetaMask.";
  }
}

// ✅ Create Tweet
async function createTweet(content) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.createTweet(content).send({
      from: accounts[0],
    });
    displayTweets(accounts[0]);
  } catch (error) {
    console.error("User rejected request:", error);
  }
}

// ✅ Display Tweets (with cartoon avatars)
async function displayTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  tweetsContainer.innerHTML = "";

  try {
    const tempTweets = await contract.methods.getAllTweets(userAddress).call();
    const tweets = [...tempTweets].sort((a, b) => b.timestamp - a.timestamp);

    for (let i = 0; i < tweets.length; i++) {
      const tweetElement = document.createElement("div");
      tweetElement.className = "tweet";

      // 🎨 Cartoon avatar (random face)
      const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${tweets[i].author}`;

      const userIcon = document.createElement("img");
      userIcon.className = "user-icon";
      userIcon.src = avatarURL;
      userIcon.alt = "avatar";
      tweetElement.appendChild(userIcon);

      const tweetInner = document.createElement("div");
      tweetInner.className = "tweet-inner";
      tweetInner.innerHTML += `
        <div class="author">${shortAddress(tweets[i].author)}</div>
        <div class="content">${tweets[i].content}</div>
      `;

      const likeButton = document.createElement("button");
      likeButton.className = "like-button";
      likeButton.innerHTML = `
        <i class="far fa-heart"></i>
        <span class="likes-count">${tweets[i].likes}</span>
      `;
      likeButton.setAttribute("data-id", tweets[i].id);
      likeButton.setAttribute("data-author", tweets[i].author);

      addLikeButtonListener(
        likeButton,
        userAddress,
        tweets[i].id,
        tweets[i].author
      );

      const likesDiv = document.createElement("div");
      likesDiv.className = "likes";
      likesDiv.appendChild(likeButton);

      tweetInner.appendChild(likesDiv);
      tweetElement.appendChild(tweetInner);
      tweetsContainer.appendChild(tweetElement);
    }
  } catch (error) {
    console.error("Error fetching tweets:", error);
  }
}

// ✅ Like Tweet
async function likeTweet(author, id) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.likeTweet(author, id).send({
      from: accounts[0],
    });
  } catch (error) {
    console.error("User rejected request:", error);
  }
}

// ✅ Add Like Button Logic
function addLikeButtonListener(likeButton, address, id, author) {
  likeButton.addEventListener("click", async (e) => {
    e.preventDefault();
    e.currentTarget.innerHTML = '<div class="spinner"></div>';
    e.currentTarget.disabled = true;
    try {
      await likeTweet(author, id);
      displayTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

// ✅ Shorten address
function shortAddress(address, startLength = 6, endLength = 4) {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

// ✅ After wallet connected
function setConnected(address) {
  document.getElementById("userAddress").innerText =
    "Connected: " + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById("tweetForm").style.display = "block";

  displayTweets(address);
}

// ✅ Listeners
document
  .getElementById("connectWalletBtn")
  .addEventListener("click", connectWallet);

document.getElementById("tweetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = document.getElementById("tweetContent").value;
  const tweetSubmitButton = document.getElementById("tweetSubmitBtn");
  tweetSubmitButton.innerHTML = '<div class="spinner"></div>';
  tweetSubmitButton.disabled = true;
  try {
    await createTweet(content);
  } catch (error) {
    console.error("Error sending tweet:", error);
  } finally {
    tweetSubmitButton.innerHTML = "Tweet";
    tweetSubmitButton.disabled = false;
  }
});
