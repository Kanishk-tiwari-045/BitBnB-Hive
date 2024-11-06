import React, { useEffect, useState } from "react";
import { Element } from "react-scroll";
import Button from "../components/Button.jsx";
import axios from "axios";
import "aos/dist/aos.css";
import TransactionHistory from "../components/TransactionHistory.jsx";

// API keys for Pinata
const pinataApiKey = "5004f4bb6975fc5b3dd5";
const pinataSecretApiKey =
  "6abc06dfffd3a54a34982349ad6281a1af35852849204db6148be88ed8444995";
const ipfsBackendUrl = "http://localhost:8080/upload";

const Hero = () => {
  const [username, setUsername] = useState(() =>
    localStorage.getItem("username")
  );
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [ipfsLink, setIpfsLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [accountDetails, setAccountDetails] = useState(null);

  useEffect(() => {
    import("aos").then((AOS) => {
      AOS.init({
        duration: 1000,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    });
  }, []);

  const loginWithKeychain = () => {
    if (window.hive_keychain) {
      window.hive_keychain.requestHandshake(() => {
        const loginMessage = "BitBnB wants to sign you in using Hive Keychain.";
        window.hive_keychain.requestSignBuffer(
          username,
          loginMessage,
          "Posting",
          (response) => {
            if (response.success) {
              setUsername(response.data.username);
              localStorage.setItem("username", response.data.username);
              fetchUserData(response.data.username);
            } else {
              console.error("Failed to log in with Hive Keychain.");
            }
          }
        );
      });
    } else {
      console.error(
        "Hive Keychain is not installed. Please install it to continue."
      );
    }
  };

  const fetchUserData = async (user) => {
    try {
      const response = await axios.post("https://api.hive.blog", {
        jsonrpc: "2.0",
        method: "condenser_api.get_accounts",
        params: [[user]],
        id: 1,
      });
      if (response.data.result) {
        setAccountDetails(response.data.result[0]);
        fetchTransactions(user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data.");
    }
  };

  const fetchTransactions = async (user) => {
    try {
      const response = await fetch("https://api.hive.blog", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "account_history_api.get_account_history",
          params: { account: user, start: -1, limit: 100 },
          id: 1,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      const filteredTransactions = data.result.history
        .filter(
          ([, op]) =>
            op.op[0] === "custom_json" && op.op[1].id === "ipfs_upload"
        )
        .map(([id, op]) => {
          try {
            const ipfsHash = JSON.parse(op.op[1].json).ipfsHash;
            return {
              id,
              timestamp: op.timestamp,
              ipfsHash,
            };
          } catch (parseError) {
            console.error("Failed to parse transaction JSON:", parseError);
            return null;
          }
        })
        .filter(Boolean);

      setTransactions(filteredTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to fetch transactions. Please try again later.");
    }
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIpfsLink(null);
    setError("");

    const project = prompt("Please enter the project name:");
    setProjectName(project);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectName", projectName);
    formData.append("username", username);

    try {
      setLoading(true);
      let ipfsHash = null;

      if (file.type === "text/html") {
        const response = await axios.post(ipfsBackendUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        ipfsHash = response.data.ipfsLink;
      } else {
        const pinataResponse = await axios.post(
          `https://api.pinata.cloud/pinning/pinFileToIPFS`,
          formData,
          {
            headers: {
              "Content-Type": `multipart/form-data`,
              pinata_api_key: pinataApiKey,
              pinata_secret_api_key: pinataSecretApiKey,
            },
          }
        );
        ipfsHash = `https://ipfs.io/ipfs/${pinataResponse.data.IpfsHash}`;
      }

      const metadata = {
        message: "Document upload",
        ipfsHash,
        fileName,
        uploadedDate: new Date().toISOString(),
      };

      if (window.hive_keychain) {
        window.hive_keychain.requestCustomJson(
          username,
          "ipfs_upload",
          "Posting",
          JSON.stringify(metadata),
          "BitBnB Document Upload",
          (response) => {
            if (response.success) {
              console.log("Metadata successfully saved on Hive blockchain.");
              setIpfsLink(ipfsHash);
            } else {
              console.error("Failed to save metadata on Hive blockchain.");
              setError("Failed to record metadata on-chain");
            }
            setLoading(false);
          }
        );
      } else {
        setError("Hive Keychain not available");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("File upload failed");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem("username");
    setFile(null);
    setFileName("");
    setProjectName("");
    setIpfsLink(null);
    setError("");
    console.log("Logged out successfully.");
  };

  useEffect(() => {
    if (username) {
      fetchUserData(username);
    }
  }, [username]);

  return (
    <section className="relative pt-60 pb-40 max-lg:pt-52 max-lg:pb-36 max-md:pt-36 max-md:pb-32">
      <Element name="hero">
        <div className="container">
          <div className="relative z-2 max-w-512 max-lg:max-w-388">
            <div className="caption small-2 uppercase text-p3">Welcome To</div>
            <h1 className="mb-6 h1 text-p4 uppercase max-lg:mb-7 max-lg:h2 max-md:mb-4 max-md:text-5xl max-md:leading-12">
              BitBnB
            </h1>
            <p className="max-w-440 mb-14 body-1 max-md:mb-10 text-p4">
              Decentralized hosting for websites, images, and more—empowering
              you with full control in a Web3 environment.
            </p>
            <div className="d-flex flex-row align-items-start">
              {username ? (
                <>
                  <p
                    style={{
                      color: "#f3ac12",
                      fontSize: "1.5rem",
                      fontWeight: "600",
                    }}
                  >
                    Welcome, {username}!
                  </p>
                  <div className="flex items-center space-x-4">
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition"
                    >
                      Choose File
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {fileName && (
                      <p className="text-sm text-gray-300">
                        Selected File: {fileName}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-4 mt-3">
                    <Button
                      icon="/images/zap.svg"
                      onClick={handleUpload}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Uploading..." : "Submit"}
                    </Button>
                    <Button
                      // icon="/images/logout.svg"
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Logout
                    </Button>
                  </div>

                  {ipfsLink && (
                    <p style={{ marginBottom: "20px" }}>
                      IPFS link:{" "}
                      <a
                        href={ipfsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ipfsLink}
                      </a>
                    </p>
                  )}

                  <TransactionHistory hiveUsername={username} />

                  <ul className="space-y-3 mt-3">
                    {transactions.map((tx, index) => (
                      <li
                        key={index}
                        className="bg-gray-800 text-gray-300 p-3 rounded-md"
                      >
                        <strong>Date:</strong>{" "}
                        {new Date(tx.timestamp).toLocaleDateString()}
                        <br />
                        <strong>IPFS Hash:</strong> {tx.ipfsHash}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Button
                  icon="/images/keychain.svg"
                  onClick={loginWithKeychain}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Log in with Hive Keychain
                </Button>
              )}
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
          <div className="absolute -top-32 left-[calc(50%-340px)] w-[1230px] pointer-events-none hero-img_res">
            <img
              src="/images/hero30.png"
              className="size-900 max-lg:h-auto"
              alt="hero"
            />
          </div>
        </div>
      </Element>
    </section>
  );
};

export default Hero;
