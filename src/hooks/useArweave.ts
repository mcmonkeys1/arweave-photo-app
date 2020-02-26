import React, { useState, useEffect } from 'react'
import { useFilesystem } from '@ionic/react-hooks/filesystem';
import { useStorage } from '@ionic/react-hooks/storage';
import { Photo } from './usePhotoGallery'
import Arweave from 'arweave/web'
import { JWKInterface } from 'arweave/web/lib/wallet';
import { isPlatform } from '@ionic/react';
const toUint8Array = require('base64-to-uint8array')
const ImageDataURI = require('image-data-uri')


const arweave = Arweave.init({})

const UNSAFE_WALLET = "keyname" // DO NOT USE IN PRODUCTION

export function useArweave(trueWallet: JWKInterface) {
	const [balance, setBalance] = useState(0)
	const [address, setAddress] = useState('')
	const [wallet,setWallet] = useState( {} ) //loaded in useEffect
	const { get, set } = useStorage();
	const { readFile } = useFilesystem();

	//WE SHOULDN'T BE SAVING THE WALLET TO LOCAL STORAGE LIKE THIS!
	useEffect( () => {
		const loadSavedWallet = async()=>{
			const walletstring = await get(UNSAFE_WALLET)
			try {
				let jwk = JSON.parse(walletstring as string)

				if(jwk){
					setWallet(jwk)
					let address = await arweave.wallets.jwkToAddress(jwk as JWKInterface)
					setAddress(address)
					let winston = await arweave.wallets.getBalance(address)
					setBalance( parseFloat(arweave.ar.winstonToAr(winston)) )
				}

			} catch (err) {
				console.log('Error loading wallet: ' + err)
				alert('Error loading wallet: ' + err)
			}
		}
		loadSavedWallet()
	}, [get])

	const loadWallet = async (ev: React.ChangeEvent<HTMLInputElement>) => {
		let file = ev.target.files![0]
		
		var jwk = {}
		var fr = new FileReader()
		fr.readAsText( file )
		fr.onload = async (ev) => {
			try {
				jwk = JSON.parse( (fr.result as string) )
					
				set(UNSAFE_WALLET,JSON.stringify(jwk)) //WE SHOULDN'T BE SAVING THE WALLET TO LOCAL STORAGE LIKE THIS!

				let address = await arweave.wallets.jwkToAddress(jwk as JWKInterface)
				setAddress(address)
				let winston = await arweave.wallets.getBalance(address)
				setBalance( parseFloat(arweave.ar.winstonToAr(winston)) )

			} catch (err) {
					alert('Error loading wallet: ' + err)
			}
		}
		return jwk //this is where we pass back trueWallet to be set
	}

	const sendPicture = async (pic: Photo) =>{
		
		if(!balance){
			alert('load a wallet with AR')
			return false
		}

		let picDecoded

		if(isPlatform('hybrid')){
			const file = await readFile({
				path: pic.filepath,
			})

			let picBase64 = file.data 
			picDecoded = toUint8Array(picBase64)
		}
		else{ //not Capacitor env
			let decodedDataUri = ImageDataURI.decode(pic.base64uri)
			picDecoded = decodedDataUri.dataBuffer
		}
		
		if(picDecoded){
			// check if too big
			const MAX_SIZE = 10*1024*1024
			let size = picDecoded.length
			if(size > MAX_SIZE){
				console.error("file too big:"+size)
				alert("file too big:"+size+'\nand I need to fix this popup')
				return false
			}
			alert('sending picture...')


			// Create Transaction & fill it with data and tags
			let tx = await arweave.createTransaction({
				data: picDecoded
			}, wallet as JWKInterface)
			

			tx.addTag('App-Name', 'hotdog-permasnap-demo')
			tx.addTag('Content-Type', 'image/jpeg')

			console.log('cost:'+ arweave.ar.winstonToAr(tx.reward))
			
			await arweave.transactions.sign(tx, wallet as JWKInterface);
			let txid = tx.id
			console.log('txid:'+txid)



			let timeStart = Date.now() 
			let response = await arweave.transactions.post(tx)
			
			console.log(response);
		
			// HTTP response codes (200 - ok, 400 - invalid transaction, 500 - error)
			if( response.status >= 400){
				throw new Error(JSON.stringify(response))
			}
			const timer = setInterval (async() => {
				let response = await arweave.transactions.getStatus(txid)
				
				// const codes = {
				// 	200: 'Permanently saved 😄',
				// 	202: 'Pending ⛏',
				// 	404: 'Not found (or not yet propagated, this can take a few seconds)',
				// 	400: 'Invalid transaction',
				// 	410: 'Transaction failed',
				// 	500: 'Unknown error'
				// }
				let msg = "Permaweb save status: " + response.status
				
				let duration = (Date.now() - timeStart)/(1000*60) //minutes
				console.log((new Date())+'::'+msg+' in '+duration+' minutes')
				if(response.status==200){ 
					clearInterval(timer) 
				}
		
			}, 10000);



		}
		else{
			alert('no picture data found')
			console.log('no picture data found')
		}
	}

	const getUploads = async () => {
		let urls: string[] = []

		let gqlQuery = `{
			transactions(from: "${address}", tags: [{name: "App-Name", value: "hotdog-permasnap-demo"}]){
				id
			}
		}`

		let res = await arweave.api.post('arql', { query: gqlQuery })
		let txids = res.data.data.transactions
		urls = txids.map( (t: { id: string; }) => 'https://arweave.net/'+t.id)

		return urls
	}

	return {
		balance,
		address,
		loadWallet,
		sendPicture,
		getUploads
	}
}








