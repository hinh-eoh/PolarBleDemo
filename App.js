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

const STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
};

const streamEcg = deviceId => {
  const to = setTimeout(() => {
    PolarBleModule.streamECG(deviceId);
    clearTimeout(to);
  }, 2000);
};

const Row = ({device, currentDeviceConnected}) => {
  const onPressConnect = useCallback(() => {
    if (currentDeviceConnected?.status === STATUS.DISCONNECTED) {
      PolarBleModule.connectDevice(device.id);
    } else {
      PolarBleModule.disConnect(device.id);
    }
  }, [currentDeviceConnected?.status, device]);

  useEffect(() => {
    if (
      currentDeviceConnected?.id === device.id &&
      currentDeviceConnected?.status === STATUS.CONNECTED
    ) {
      streamEcg(device.id);
    }
  }, [currentDeviceConnected?.id, currentDeviceConnected?.status, device.id]);

  if (
    currentDeviceConnected?.id &&
    currentDeviceConnected?.id !== device.id &&
    currentDeviceConnected.status !== STATUS.DISCONNECTED
  ) {
    return null;
  }

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.text}>{device?.name}</Text>
        {currentDeviceConnected?.status !== STATUS.DISCONNECTED && (
          <Text style={styles.text}>{currentDeviceConnected?.status}</Text>
        )}
      </View>

      <Button
        title={
          currentDeviceConnected?.status === STATUS.DISCONNECTED
            ? 'Connect'
            : 'Disconnect'
        }
        onPress={onPressConnect}
      />
    </View>
  );
};

const App = () => {
  const [devices, setDevices] = useState([]);
  const [dataHr, setDataHr] = useState([]);
  const [ecgData, setEcgData] = useState([]);

  // Separated
  const [currentDeviceConnected, setCurrentDeviceConnected] = useState({
    status: STATUS.DISCONNECTED,
  });

  const onPressScan = useCallback(() => {
    setDevices([]);
    PolarBleModule.startScan();
  }, []);

  useEffect(() => {
    const listenDeviceFound = eventEmitter.addListener(
      'onDeviceFound',
      device => {
        setDevices(prev => {
          if (!prev.some(i => i.id === device.id)) {
            return prev.concat(device);
          }
          return prev;
        });
      },
    );
    return () => listenDeviceFound?.remove();
  }, []);

  useEffect(() => {
    permitPermissionFunction(keyPermission.LOCATION, () => {});
  }, []);

  useEffect(() => {
    const listenHrData = eventEmitter.addListener('HrData', data => {
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

    const listenEcgData = eventEmitter.addListener('EcgData', data => {
      mqttSendMessage('PolarEcgData', JSON.stringify(data));
      setEcgData(prev => {
        if (prev.length > 73 * 2) {
          return prev.splice(73, prev.length).concat(data.samples);
        } else {
          return prev.concat(data.samples);
        }
      });
    });

    return () => {
      listenHrData?.remove();
      listenEcgData?.remove();
    };
  }, []);

  useEffect(() => {
    if (
      currentDeviceConnected?.id &&
      currentDeviceConnected.status === STATUS.DISCONNECTED
    ) {
      setDataHr([]);
      setEcgData([]);
    }
  }, [currentDeviceConnected?.id, currentDeviceConnected.status]);

  useEffect(() => {
    const event = eventEmitter.addListener('status_change', data => {
      setCurrentDeviceConnected(data);
    });
    return () => event?.remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{paddingTop: 60}}>
      <Button title="Scan" onPress={onPressScan} />
      <View style={styles.wrap}>
        {devices?.map(item => (
          <Row
            device={item}
            key={item.id}
            currentDeviceConnected={currentDeviceConnected}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={{paddingTop: 20, paddingBottom: 70}}>
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
    </View>
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
