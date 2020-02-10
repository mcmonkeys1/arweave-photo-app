import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle,IonLabel,
  IonToolbar,IonButton, IonItem } from '@ionic/react';
import {  useArweave } from '../hooks/useArweave'



const Tab3Page: React.FC = () => {
  const { balance, address, loadWallet } = useArweave()

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
          <input type='file' onChange={loadWallet}/>
        </IonItem>
      </IonContent>
    </IonPage>
  );
};

export default Tab3Page;
