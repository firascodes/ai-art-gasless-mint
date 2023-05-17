import { useState } from "react";
import axios from "axios";
import { NFTStorage } from "nft.storage";

function App() {
  const [prompt, setPrompt] = useState("");

  console.log(prompt);

  const [imageBlob, setImageBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null)

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [minted, setMinted] = useState(false);
  
  const cleanupIPFS = (url) => {
    if(url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  }

  const generateArt = async () => {
    setIsLoading(true)
		try {
			const response = await axios.post(
				`https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
				{
					headers: {
						Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}}`,
					},
					method: "POST",
					inputs: prompt,
				},
				{ responseType: "blob" }
			);
			// convert blob to a image file type
			const file = new File([response.data], "image.jpeg", {
				type: "image/jpeg",
			});
			console.log(file);
			setFile(file);
			console.log(response);
			const url = URL.createObjectURL(response.data);
			console.log(url);
			setImageBlob(url);
		} catch (err) {
			console.log(err);
      setError(true)
		} finally {
      setIsLoading(false)
    }
	};

  const uploadArtToIpfs = async () => {
    console.log("ipfs function...");
    try {
  
      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_NFT_STORAGE,
      })
  
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file
      })
  
      console.log(store)
  
      return cleanupIPFS(store.data.image.href)

    } catch(err) {
      console.log(err)
      return null
    }
  }

  const mintNft = async () => {
    try {
      console.log("minting....");
      const imageURL = await uploadArtToIpfs(file);
  
      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: name?.length > 0 ? name : "AI NFT",
					description: description?.length > 0 ? description : "AI generated NFT",
					mint_to_address: address?.length > 0 ? address : "0xeb405AA12A9F2D6313A3CD42704144179FA61E20",
        },
        {
          headers: {
            Authorization: process.env.REACT_APP_NFT_PORT,
          }
        }
      );
      const data = await response.data;
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };
  

  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI ART GASLESS MINT</h1>
      <div className="flex items-center justify-center gap-4">
        <input
          className="border-2 border-black rounded-md p-2"
          onChange={(e) => setPrompt(e.target.value)}
          type="text"
          placeholder="Enter a prompt!"
        />
        <button
          className="text-white hover:bg-gray-100 hover:text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          onClick={generateArt}
        >
          Generate
        </button>
      </div>
      {isLoading && (
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      )}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded relative"
          role="alert"
        >
          <strong className="font-bold">{error} - </strong>
          <span className="block sm:inline">Please try again later.</span>
        </div>
      )}
          {imageBlob && (
            <div className="flex flex-col items-center justify-content gap-4">
            <img
              src={imageBlob}
              alt="AI generated art"
            />
          </div>
          )}
      {
              minted ? <p>Minted this NFT</p> : (
                <div className="flex flex-col items-center justify-center gap-4">
        {/* input for name */}
        <input
          className="border-2 border-black rounded-md p-2"
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Enter a name"
        />
        {/* input for description */}
        <input
          className="border-2 border-black rounded-md p-2"
          onChange={(e) => setDescription(e.target.value)}
          type="text"
          placeholder="Enter a description"
        />
        {/* input for address */}
        <input
          className="border-2 border-black rounded-md p-2"
          onChange={(e) => setAddress(e.target.value)}
          type="text"
          placeholder="Enter a address"
        />
        {/* button to mint */}
        <button
          onClick={mintNft}
          className="bg-black text-white rounded-md p-2"
        >
          Mint
        </button>
      </div>
              )
            }
    </div>
  );
}

export default App;
