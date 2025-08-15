import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#007bff',
  },
};

interface OrdersLineChartProps {
  data: ChartData;
  title: string;
}

export const OrdersLineChart: React.FC<OrdersLineChartProps> = ({ data, title }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

interface OrdersBarChartProps {
  data: ChartData;
  title: string;
}

export const OrdersBarChart: React.FC<OrdersBarChartProps> = ({ data, title }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <BarChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=""
        showValuesOnTopOfBars
      />
    </View>
  );
};

interface StatusPieChartProps {
  data: PieChartData[];
  title: string;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({ data, title }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <PieChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 50]}
        absolute
        style={styles.chart}
      />
    </View>
  );
};

interface ProgressRingProps {
  data: {
    labels: string[];
    data: number[];
  };
  title: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ data, title }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <ProgressChart
        data={data}
        width={screenWidth - 40}
        height={220}
        strokeWidth={16}
        radius={32}
        chartConfig={chartConfig}
        hideLegend={false}
        style={styles.chart}
      />
    </View>
  );
};

interface TechnicianPerformanceProps {
  data: Array<{
    name: string;
    ordersCompleted: number;
    averageRating: number;
    completionRate: number;
  }>;
}

export const TechnicianPerformanceChart: React.FC<TechnicianPerformanceProps> = ({ data }) => {
  const chartData: ChartData = {
    labels: data.map(item => item.name.split(' ')[0]), // Primeiro nome apenas
    datasets: [
      {
        data: data.map(item => item.ordersCompleted),
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Desempenho dos Técnicos</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=" ordens"
        showValuesOnTopOfBars
      />
      
      <View style={styles.performanceDetails}>
        {data.map((technician, index) => (
          <View key={index} style={styles.performanceItem}>
            <Text style={styles.technicianName}>{technician.name}</Text>
            <View style={styles.performanceStats}>
              <Text style={styles.statText}>
                Ordens: {technician.ordersCompleted}
              </Text>
              <Text style={styles.statText}>
                Avaliação: {technician.averageRating.toFixed(1)}/5
              </Text>
              <Text style={styles.statText}>
                Taxa: {(technician.completionRate * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

interface MonthlyTrendsProps {
  data: Array<{
    month: string;
    created: number;
    completed: number;
    cancelled: number;
  }>;
}

export const MonthlyTrendsChart: React.FC<MonthlyTrendsProps> = ({ data }) => {
  const chartData: ChartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        data: data.map(item => item.created),
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: data.map(item => item.completed),
        color: (opacity = 1) => `rgba(40, 167, 69, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: data.map(item => item.cancelled),
        color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Tendências Mensais</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#007bff' }]} />
          <Text style={styles.legendText}>Criadas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#28a745' }]} />
          <Text style={styles.legendText}>Concluídas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#dc3545' }]} />
          <Text style={styles.legendText}>Canceladas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  performanceDetails: {
    marginTop: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  technicianName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  performanceStats: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'space-around',
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default {
  OrdersLineChart,
  OrdersBarChart,
  StatusPieChart,
  ProgressRing,
  TechnicianPerformanceChart,
  MonthlyTrendsChart,
};

