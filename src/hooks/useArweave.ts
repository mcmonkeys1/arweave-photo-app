import React, { useState, useEffect } from 'react'
import { useFilesystem, base64FromPath } from '@ionic/react-hooks/filesystem';
import { useStorage } from '@ionic/react-hooks/storage';
import { FilesystemDirectory } from '@capacitor/core'
import { Photo } from './usePhotoGallery'
import Arweave from 'arweave/web'
import { JWKInterface } from 'arweave/web/lib/wallet';
import { wallet } from 'ionicons/icons';
import { isPlatform } from '@ionic/react';
import { Buffer } from 'buffer';
import { decode } from 'base64-arraybuffer'


const arweave = Arweave.init({})

const UNSAFE_WALLET = "keyname" // DO NOT USE IN PRODUCTION

export function useArweave() {
	const [balance, setBalance] = useState(0)
	const [address, setAddress] = useState('')
	const [wallet,setWallet] = useState( {} ) //loaded in useEffect
	const { get, set } = useStorage();
	const { getUri, readFile } = useFilesystem();

	//WE SHOULDN'T BE SAVING THE WALLET TO LOCAL STORAGE LIKE THIS!
	useEffect( () => {
		const loadSavedWallet = async()=>{
			const walletstring = await get(UNSAFE_WALLET)
			try {
				let jwk = JSON.parse(walletstring as string)

				setWallet(jwk)
				let address = await arweave.wallets.jwkToAddress(jwk as JWKInterface)
				setAddress(address)
				let winston = await arweave.wallets.getBalance(address)
				setBalance( parseFloat(arweave.ar.winstonToAr(winston)) )

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
	}

	const sendPicture = async (pic: Photo) =>{
		
		if(!balance){
			alert('load a wallet with AR')
			return false
		}

		let picBase64: string

		if(isPlatform('hybrid')){
			const file = await readFile({
				path: pic.filepath,
			})
			// //what do we use???
			// pic.base64 / file.data / ???

			console.log('pic.base64 ******************* '+pic.base64)
			console.log('file.data ******************* '+file.data)

			picBase64 = file.data 
		}
		else{ //not Capacitor env
			picBase64 = pic.base64!
			console.log(picBase64)
		}

		if(picBase64){
			// check if too big
			const MAX_SIZE = 10*1024*1024
			let size = picBase64.length
			if(size > MAX_SIZE){
				console.error("file too big:"+size)
				alert("file too big:"+size+'\nand I need to fix this popup')
				return false
			}
			console.log('sending picture...')
			alert('sending picture...')
			
			const _base64ToArrayBuffer = (base64: string) => {
				var binary_string = window.atob(base64);
				var len = binary_string.length;
				var bytes = new Uint8Array(len);
				for (var i = 0; i < len; i++) {
						bytes[i] = binary_string.charCodeAt(i);
				}
				return bytes.buffer;
			}

			// Create Transaction & fill it with data and tags
			let tx = await arweave.createTransaction({
				data: new Uint8Array(_base64ToArrayBuffer(picBase64) )  /********************************************** */
			}, wallet as JWKInterface)
			

			tx.addTag('App-Name', 'hotdog-permasnap-demo')
			tx.addTag('Content-Type', 'image/jpeg')

			console.log('cost:'+ arweave.ar.winstonToAr(tx.reward))
			
			await arweave.transactions.sign(tx, wallet as JWKInterface);
			let txid = tx.id
			console.log('**********************************************************')
			console.log('txid:'+txid)
			console.log('**********************************************************')
			console.log(tx)



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
				
				console.log((new Date())+'::'+msg)
				let duration = (Date.now() - timeStart)/(1000*60) //minutes
				console.log(msg+' in '+duration+' minutes')
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

	return {
		balance,
		address,
		loadWallet,
		sendPicture
	}
}








