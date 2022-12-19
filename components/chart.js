import React, {useMemo} from 'react';
import {View} from 'react-native';
import {
  VictoryChart,
  VictoryTheme,
  VictoryLine,
  VictoryAxis,
} from 'victory-native';

const HrChart = ({dataHr}) => {
  const xTickValues = useMemo(
    () => dataHr.slice(-10).map(item => item.x),
    [dataHr],
  );

  return (
    <View>
      <VictoryChart width={450} theme={VictoryTheme.material}>
        <VictoryAxis
          tickValues={xTickValues}
          tickFormat={t =>
            `${new Date(t).getMinutes()}:${new Date(t).getSeconds()}`
          }
          fixLabelOverlap={true}
        />
        <VictoryAxis dependentAxis tickFormat={x => x} />
        <VictoryLine data={dataHr} />
      </VictoryChart>
    </View>
  );
};

export default HrChart;
