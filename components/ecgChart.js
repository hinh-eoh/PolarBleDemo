import React from 'react';
import {View} from 'react-native';
import {
  VictoryChart,
  VictoryTheme,
  VictoryLine,
  VictoryAxis,
} from 'victory-native';

const EcgChart = ({dataEcg}) => {
  return (
    <View>
      <VictoryChart width={450} theme={VictoryTheme.material}>
        <VictoryAxis offsetY={50} />
        <VictoryAxis
          dependentAxis
          tickFormat={x => x}
          tickValues={[-200, 0, 200, 600, 1000, 1400]}
        />
        <VictoryLine data={dataEcg} />
      </VictoryChart>
    </View>
  );
};

export default EcgChart;
