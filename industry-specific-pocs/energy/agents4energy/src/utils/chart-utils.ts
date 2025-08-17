// import { Chart as ChartJS, Plugin } from 'chart.js';
// import 'chartjs-plugin-datalabels';
// import type { Context } from 'chartjs-plugin-datalabels';

// interface DataLabel {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   datasetIndex: number;
//   index: number;
// }

// export const CustomDataLabelsPlugin: Plugin = {
//   id: 'customDataLabels',
//   beforeDraw(chart: ChartJS) {
//     const ctx = chart.ctx;
//     const dataLabels: DataLabel[] = [];
    
//     // Get all data labels positions and dimensions
//     chart.data.datasets.forEach((dataset, datasetIndex) => {
//       const meta = chart.getDatasetMeta(datasetIndex);
      
//       if (!meta.hidden) {
//         meta.data.forEach((element, index) => {
//           const { x, y } = element.getCenterPoint();
          
//           // Get the data label for this point
//           const value = dataset.data[index];
//           const label = chart.options?.plugins?.datalabels?.formatter?.(
//             value,
//             { dataIndex: index, dataset, datasetIndex }
//           )?.toString() || value?.toString();
          
//           // Measure text width and height
//           const textMetrics = ctx.measureText(label);
//           const textWidth = textMetrics.width;
//           const fontSize = chart.options?.plugins?.datalabels?.font?.size as number || 12;
          
//           dataLabels.push({
//             x,
//             y,
//             width: textWidth,
//             height: fontSize,
//             datasetIndex,
//             index
//           });
//         });
//       }
//     });

//     // Check for overlaps and adjust positions
//     for (let i = 0; i < dataLabels.length; i++) {
//       for (let j = i + 1; j < dataLabels.length; j++) {
//         if (checkOverlap(dataLabels[i], dataLabels[j])) {
//           const meta = chart.getDatasetMeta(dataLabels[j].datasetIndex);
//           const datalabelsPlugin = meta.controller.$context.chart.options.plugins.datalabels;
          
//           if (dataLabels[i].y > dataLabels[j].y) {
//             // Move second label up
//             datalabelsPlugin.align = 'bottom';
//             datalabelsPlugin.offset = 10;
//           } else {
//             // Move second label down
//             datalabelsPlugin.align = 'top';
//             datalabelsPlugin.offset = -10;
//           }
//         }
//       }
//     }
//   }
// };

// function checkOverlap(label1: DataLabel, label2: DataLabel): boolean {
//   return !(
//     label1.x + label1.width / 2 < label2.x - label2.width / 2 ||
//     label1.x - label1.width / 2 > label2.x + label2.width / 2 ||
//     label1.y + label1.height / 2 < label2.y - label2.height / 2 ||
//     label1.y - label1.height / 2 > label2.y + label2.height / 2
//   );
// }