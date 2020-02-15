import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { photos } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import {useArweave } from '../hooks/useArweave'
import { JWKInterface } from 'arweave/web/lib/wallet';

interface IProps {
  setWallet: any
  wallet: JWKInterface
}

const Tab1: React.FC<IProps> = ({wallet}) => {
  const { getUploads } = useArweave(wallet)
  const [ urls, setUrls] = useState<string[]>([])

  const asyncGetUploads = async () => {
    const sArray = await getUploads()
    setUrls(sArray)
  }

  useEffect( () => {// look for new uploads
    asyncGetUploads()
  })

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Share your permanent photos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none">
          <IonListHeader>
            <IonLabel>Links to files uploaded with current wallet</IonLabel>
          </IonListHeader>
          { urls.map(url => (
            <IonItem href={url} key={url} target="_blank">
              <IonIcon slot="start" color="medium" icon={photos} />
              <IonLabel>{url}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
