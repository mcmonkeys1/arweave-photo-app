import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle,IonLabel,
  IonToolbar, IonItem } from '@ionic/react';
import {  useArweave } from '../hooks/useArweave'
import { JWKInterface } from 'arweave/web/lib/wallet';


interface IProps {
  setWallet: any
  wallet: JWKInterface
}

const Tab3Page: React.FC<IProps> = ({wallet, setWallet}) => {
  const { balance, address, loadWallet } = useArweave(wallet)

  const onLoadWallet = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    let newWallet = await loadWallet(ev)
    setWallet(newWallet) //TODO: make sure everyone's using this one!
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Wallet info</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel>Wallet Address</IonLabel>
          {address ? address : 'Wallet not loaded'}
        </IonItem>
        <IonItem>
          <IonLabel>Balance</IonLabel>
          {balance}
        </IonItem>
        <IonItem >Load Wallet  : 
          <input type='file' onChange={onLoadWallet}/>
        </IonItem>
      </IonContent>
    </IonPage>
  );
};

export default Tab3Page;
