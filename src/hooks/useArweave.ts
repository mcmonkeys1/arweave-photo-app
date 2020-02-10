import React, { useState, useEffect } from 'react'
import { useFilesystem, base64FromPath } from '@ionic/react-hooks/filesystem';
import { useStorage } from '@ionic/react-hooks/storage';
import { Photo } from './usePhotoGallery'
import Arweave from 'arweave/web'
import { JWKInterface } from 'arweave/web/lib/wallet';
import { wallet } from 'ionicons/icons';

const arweave = Arweave.init({})

const UNSAFE_WALLET = "keyname" // DO NOT USE IN PRODUCTION

export function useArweave() {
	const [balance, setBalance] = useState(0)
	const [address, setAddress] = useState('')
	const [wallet,setWallet] = useState( {} ) //loaded in useEffect
	const { get, set } = useStorage();

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

	const sendPicture = (pic: Photo) =>{
		
		if(!balance){
			alert('load a wallet with AR')
			return false
		}
		if(pic.base64){
			const MAX_SIZE = 10*1024*1024
			let size = pic.base64.length
			if(size > MAX_SIZE){
				console.error("file too big:"+size)
				alert("file too big:"+size+'\nand I need to fix this popup')
				return false
			}
			console.log('sending picture...')
			alert('sending picture...')
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