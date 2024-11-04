import React, { useEffect, useState } from 'react';
import { Element } from "react-scroll";
import Button from "../components/Button.jsx";
import axios from 'axios';
import 'aos/dist/aos.css';

// API keys for Pinata
const pinataApiKey = '5004f4bb6975fc5b3dd5';
const pinataSecretApiKey = '6abc06dfffd3a54a34982349ad6281a1af35852849204db6148be88ed8444995';
const ipfsBackendUrl = 'http://localhost:8080/upload';

const Hero = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('username')); // Retrieve username from local storage
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [ipfsLink, setIpfsLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    import('aos').then(AOS => {
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
        window.hive_keychain.requestSignBuffer(null, 'Login verification', 'Posting', (response) => {
          if (response.success) {
            setUsername(response.data.username);
            localStorage.setItem('username', response.data.username); // Save username to local storage
          } else {
            console.error('Failed to log in with Hive Keychain.');
          }
        });
      });
    } else {
      console.error('Hive Keychain is not installed. Please install it to continue.');
    }
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem('username'); // Remove username from local storage
    setFile(null);
    setFileName('');
    setProjectName('');
    setIpfsLink(null);
    setError('');
    console.log('Logged out successfully.');
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIpfsLink(null);
    setError('');

    const project = prompt("Please enter the project name:");
    setProjectName(project);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const fileType = file.type;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('projectName', projectName);
    formData.append('username', username); 

    try {
      setLoading(true);
      let ipfsHash = null;

      if (fileType === 'text/html') {
        const response = await axios.post(ipfsBackendUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        ipfsHash = response.data.ipfsLink;
      } else {
        const pinataResponse = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`, formData, {
          headers: {
            'Content-Type': `multipart/form-data`,
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        });
        ipfsHash = `https://ipfs.io/ipfs/${pinataResponse.data.IpfsHash}`;
      }

      setIpfsLink(ipfsHash);
      setLoading(false);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError('File upload failed');
      setLoading(false);
    }
  };

  return (
    <section className="relative pt-60 pb-40 max-lg:pt-52 max-lg:pb-36 max-md:pt-36 max-md:pb-32">
      <Element name="hero">
        <div className="container">
          <div className="relative z-2 max-w-512 max-lg:max-w-388">
            <div className="caption small-2 uppercase text-p3">
              Welcome To
            </div>
            <h1 className="mb-6 h1 text-p4 uppercase max-lg:mb-7 max-lg:h2 max-md:mb-4 max-md:text-5xl max-md:leading-12">
              BitBnB
            </h1>
            <p className="max-w-440 mb-14 body-1 max-md:mb-10">
              Decentralized hosting for websites, images, and more—empowering you with full control in a Web3 environment.
            </p>
            <div className="d-flex flex-row align-items-start">
              {username ? (
                <>
                  <p style={{ color: '#f3ac12', fontSize: '1.5rem', fontWeight: '600' }}>
                    Welcome, {username}!
                  </p>
                  <div className="hidden lg:block" style={{ width: '1px', height: '10px', backgroundColor: 'transparent', margin: '10px 0' }}></div>
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
                    <p className="mt-2 text-sm text-gray-300">
                      Selected File: {fileName}
                    </p>
                  )}
                  <div className="hidden lg:block" style={{ width: '1px', height: '20px', backgroundColor: 'transparent' }}></div>

                  <Button icon="/images/zap.svg" onClick={handleUpload} className="mb-3">
                    {loading ? 'Uploading...' : 'Submit'}
                  </Button>
                  <div className="hidden lg:block" style={{ width: '1px', height: '20px', backgroundColor: 'transparent' }}></div>

                  {ipfsLink && (
                    <p style={{ marginBottom: '20px' }}>
                      IPFS link: <a href={ipfsLink} target="_blank" rel="noopener noreferrer">{ipfsLink}</a>
                    </p>
                  )}
                  <Button icon="/images/logout.svg" onClick={handleLogout}>
                    Logout
                  </Button>
                  <div className="hidden lg:block" style={{ width: '1px', height: '20px', backgroundColor: 'transparent' }}></div>
                  {error && <p style={{ color: 'red' }}>{error}</p>}
                </>
              ) : (
                <Button icon="/images/keychain.svg" onClick={loginWithKeychain}>
                  Start Hive Keychain
                </Button>
              )}
            </div>
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
