import React, {useEffect, useCallback, useState} from 'react';
import {
  StyleSheet,
  View,
  Button,
  NativeEventEmitter,
  Text,
  ScrollView,
} from 'react-native';

import HrChart from './components/chart';
import EcgChart from './components/ecgChart';
import {mqttSendMessage} from './components/mqtt';
import PolarBleModule from '@eohjsc/react-native-polar';
import {permitPermissionFunction, keyPermission} from './utils/permission';

const eventEmitter = new NativeEventEmitter(PolarBleModule);

const Row = ({device, setDeviceId, deviceId, setStatusDevice}) => {
  const [status, setStatus] = useState('disconnected');

  const onPressConnect = useCallback(() => {
    if (status === 'disconnected') {
      setDeviceId && setDeviceId(device?.id);
    } else {
      setDeviceId(null);
      PolarBleModule.disConnect(deviceId);
    }
  }, [device?.id, deviceId, status, setDeviceId]);

  useEffect(() => {
    const event = eventEmitter.addListener('status_change', data => {
      setStatus(data.status);
      setStatusDevice(data.status);
    });
    return () => event?.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (deviceId && deviceId !== device.id) {
    return null;
  }

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.text}>{device?.name}</Text>
        {status !== 'disconnected' && <Text style={styles.text}>{status}</Text>}
      </View>

      <Button
        title={status === 'disconnected' ? 'Connect' : 'Disconnect'}
        onPress={onPressConnect}
      />
    </View>
  );
};

const App = () => {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState();
  const [statusDevice, setStatusDevice] = useState();
  const [dataHr, setDataHr] = useState([]);
  const [ecgData, setEcgData] = useState([]);

  const onPressScan = useCallback(() => {
    setDevices([]);
    PolarBleModule.startScan();
  }, []);

  useEffect(() => {
    eventEmitter.addListener('onDeviceFound', device =>
      setDevices([...devices, device]),
    );
  }, [devices]);

  useEffect(() => {
    let hrData = null;
    let exgData = null;

    if (deviceId) {
      PolarBleModule.connectDevice(deviceId);
      if (statusDevice === 'connected') {
        setTimeout(() => {
          PolarBleModule.streamECG(deviceId);
        }, 2000);
      }

      hrData = eventEmitter.addListener('HrData', data => {
        mqttSendMessage('PolarHrData', JSON.stringify(data));
        const x = new Date();
        setDataHr(prev => {
          if (prev.length > 10) {
            prev.shift();
            return [...prev, {x, y: data.hr}];
          } else {
            return [...prev, {x, y: data.hr}];
          }
        });
      });
      exgData = eventEmitter.addListener('EcgData', data => {
        mqttSendMessage('PolarEcgData', JSON.stringify(data));
        setEcgData(prev => {
          if (prev.length > 73 * 2) {
            return prev.splice(73, prev.length).concat(data.samples);
          } else {
            return prev.concat(data.samples);
          }
        });
      });
    }

    return () => {
      if (hrData !== null) {
        hrData.remove();
      }
      if (exgData !== null) {
        exgData.remove();
      }
    };
  }, [deviceId, statusDevice]);

  useEffect(() => {
    permitPermissionFunction(keyPermission.LOCATION, () => {});
  }, []);

  useEffect(() => {
    if (!deviceId) {
      setDataHr([]);
      setEcgData([]);
    }
  }, [deviceId]);

  return (
    <ScrollView>
      <Button title="Scan" onPress={onPressScan} />

      <View style={styles.wrap}>
        {devices?.map(item => (
          <Row
            device={item}
            setDeviceId={setDeviceId}
            key={item.id}
            deviceId={deviceId}
            setStatusDevice={setStatusDevice}
          />
        ))}
      </View>

      {!!dataHr.length && (
        <View style={styles.wrapHr}>
          <Text>Data Heart Rate</Text>
          <View style={styles.dataHr}>
            <Text style={styles.textHr}>{dataHr[dataHr.length - 1].y}</Text>
          </View>
        </View>
      )}
      {!!dataHr.length && <HrChart dataHr={dataHr} />}

      {!!ecgData.length && (
        <View style={styles.wrapHr}>
          <Text>Data ECG</Text>
          <View style={styles.dataHr}>
            {ecgData.slice(-73).map((item, index) => {
              return (
                <Text style={styles.textHr} key={index}>
                  {item}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      {!!ecgData.length && <EcgChart dataEcg={ecgData} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '800',
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wrap: {
    paddingHorizontal: 20,
  },
  wrapHr: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  dataHr: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  textHr: {
    marginRight: 10,
  },
});

export default App;
