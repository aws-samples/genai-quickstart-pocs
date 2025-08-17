"use client"
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Link, Box } from '@mui/material';

import {
  Button,
  Container,
  Popover,
//Spinner,
  StatusIndicator
} from "@cloudscape-design/components";

import { stringify } from 'yaml'

import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

import { formatDate } from "@/utils/date-utils";
import { amplifyClient, invokeBedrockModelParseBodyGetText, isValidJSON, getMessageCatigory } from '@/utils/amplify-utils';

import styles from "@/styles/chat-ui.module.scss";

import React, { useState, useEffect } from "react";
import { Message } from "../utils/types";

// import PlotComponent from '../PlotComponent'
import { Scatter } from 'react-chartjs-2';
// import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import {
  Chart as ChartJS,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartData,
  TimeScale,
  ChartOptions
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

ChartJS.register(
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin,
  ChartDataLabels,
  // annotationPlugin
);

export interface ChatUIMessageProps {
  // message: Schema["ChatMessage"]["type"];
  message: Message;
  // messages: Message[];
  showCopyButton?: boolean;
}

//https://json-schema.org/understanding-json-schema/reference/array
const getDataQualityCheckSchema = {
  title: "DataQualityCheck",
  description: "Identify any inaccurate data",
  type: "object",
  properties: {
    dataChecks: {
      type: 'array',
      items: {
        type: 'string'
      },
      minItems: 0,
      maxItems: 5,
      description: "Identified issues"
    }
  },
  required: ['dataChecks'],
};

// function isValidJSON(str: string): boolean {
//   try {
//     JSON.parse(str);
//     return true;
//   } catch {
//     return false;
//   }
// }

// const jsonParseHandleError = (jsonString: string) => {
//   try {
//     return JSON.parse(jsonString)
//   } catch {
//     console.warn(`Could not parse string: ${jsonString}`)
//   }
// }

function transformListToObject<T extends Record<string, string | number>>(
  list: T[]
): { [K in keyof T]: T[K][] } {
  return Object.keys(list[0]).reduce((acc, key) => {
    // if (list.some(item => !item || !(key in item))) throw new Error(`Key ${key} not found in all items`)
    // if (list.some(item => !item || !(key in item))) return {}
    return {
      ...acc,
      [key]: list.map(item => {
        if (item && key in item) return item[key as keyof T]
      })
    };
  }, {}) as { [K in keyof T]: T[K][] };
}

type RowDataInput = {
  [key: string]: (string | number)
}[];

type TransformToDataRowsOutputData = {
  id: string;
  [key: string]: string;
};

function generateColor(index: number): string {
  const hue = (index * 137.508) % 360; // Use golden angle approximation
  return `hsl(${hue}, 70%, 60%)`;
}

export default function ChatUIMessage(props: ChatUIMessageProps) {
  const [hideRows, setHideRows] = useState<boolean>(true)
  const [glossaryBlurbs, setGlossaryBlurbs] = useState<{ [key: string]: string }>({})
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataQualityBlurb, setDataQualityBlurb] = useState("")
  const [MessagePlot, setMessagePlot] = useState<() => React.JSX.Element>()
  // const [MessagePlot, setMessagePlot] = useState<React.ElementType>(() => (<div></div>))
  const [MessageTable, setMessageTable] = useState<React.FC>()
  if (!props.message.createdAt) throw new Error("Message createdAt missing");

  const messageContentCategory = getMessageCatigory(props.message);

  // const previousMessages = props.messages.slice(0, props.messages.indexOf(props.message))

  // Set the plot and table messages
  useEffect(() => {
    // console.log("Number of Previous Messages: ", previousMessages.length)
    const nonDefaultColumns = ['s3Key', 'relevantPartOfJsonObject', 'includeScoreExplanation', 'includeScore']
    switch (messageContentCategory) {
      case 'tool_plot':
        const { chartTitle, includePreviousEventTable, includePreviousDataTable } = JSON.parse(props.message.content) as {
          // columnNameFromQueryForXAxis: string,
          chartTitle: string | undefined,
          // numberOfPreviousTablesToInclude: number,
          includePreviousEventTable: boolean,
          includePreviousDataTable: boolean
        }

        // //Limit messages to those before the plot message
        // const previousMessages = props.messages.slice(0, props.messages.indexOf(props.message))

        // const toolResponseMessages = previousMessages.filter(
        //   (message) =>
        //     "tool_call_id" in message &&
        //     message.tool_call_id &&
        //     jsonParseHandleError(message.content as string) &&
        //     JSON.parse(message.content as string).messageContentType === 'tool_table'
        // )

        // // console.log('Tool Response Messages:\n', toolResponseMessages)

        // const dataTableMessages = toolResponseMessages.filter(
        //   (message) => {
        //     const chartContent = JSON.parse(message.content) as {
        //       queryResponseData: RowDataInput,
        //     }

        //     if (chartContent.queryResponseData.length === 0 || !chartContent.queryResponseData[0]) return false

        //     const chartDataObject = transformListToObject(chartContent.queryResponseData)

        //     const chartTrendNames = Object.keys(chartDataObject)

        //     const tableType = chartTrendNames.includes('s3Key') ? 'events' : 'trend'

        //     return tableType === 'trend'
        //   }
        // )

        // const eventTableMessages = toolResponseMessages.filter(
        //   (message) => {
        //     const chartContent = JSON.parse(message.content) as {
        //       queryResponseData: RowDataInput,
        //     }

        //     if (chartContent.queryResponseData.length === 0 || !chartContent.queryResponseData[0]) return false

        //     const chartDataObject = transformListToObject(chartContent.queryResponseData)

        //     const chartTrendNames = Object.keys(chartDataObject)

        //     const tableType = chartTrendNames.includes('s3Key') ? 'events' : 'trend'

        //     return tableType === 'events'
        //   }
        // )

        const selectedToolMessages = [
          ...includePreviousDataTable ? [props.message.previousTrendTableMessage] : [],
          ...includePreviousEventTable ? [props.message.previousEventTableMessage] : []

        ]

        // console.log("Selected messages: ", selectedToolMessages)

        if (selectedToolMessages.length === 0) return

        interface ScatterDataPoint {
          x: Date | number;
          y?: number;
          url?: string;
          rowData?: string;
        }

        const data: ChartData<'scatter', ScatterDataPoint[]> = { datasets: [] }

        const xAxisLabels = selectedToolMessages.map((selectedToolMessage) => {
          if (!selectedToolMessage) return

          const chartContent = JSON.parse(selectedToolMessage.content) as {
            queryResponseData: RowDataInput,
          }

          if (!chartContent.queryResponseData || chartContent.queryResponseData.length === 0 || !chartContent.queryResponseData[0]) return

          const chartQueryResponsesWithDate = chartContent.queryResponseData
            .filter(dataRow => { //The first key in the object must contain a date
              const dateCandidate = dataRow[Object.keys(dataRow)[0]]
              // console.log('dateCandidate: ', dateCandidate)
              return (dateCandidate !== null) &&
                !isNaN((new Date(dateCandidate)).getTime())
            })

          // console.log('chart query responses with date: ', chartQueryResponsesWithDate)


          const chartDataObject = transformListToObject(chartQueryResponsesWithDate)

          // console.log('chart data: ', chartDataObject)

          const chartTrendNames = Object.keys(chartDataObject)

          const tableType = chartTrendNames.includes('s3Key') ? 'events' : 'trend'

          // console.log('table type: ', tableType)

          switch (tableType) {
            case 'events':
              // console.log('chartQueryResponsesWithDate:\n', stringify(chartQueryResponsesWithDate))
              const newEventData: ChartData<'scatter', ScatterDataPoint[]> = {
                // labels: ['event'.repeat(chartDataObject[chartTrendNames[0]].length)],
                datasets: [
                  {
                    data: chartDataObject[chartTrendNames[0]].map((xValue, i) => ({
                      x: new Date(xValue), // Convert to Date object
                      y: 100,
                      url: `/files/${chartDataObject['s3Key'][i]}`.slice(0, -5),//Remove the .yaml,
                      rowData: stringify(Object.keys(chartDataObject)
                        .filter((columnName) => !nonDefaultColumns.includes(columnName))
                        .reduce((acc, key) => ({ //Create a yaml string with the row's data
                          ...acc,
                          [key]: chartDataObject[key][i]
                        }), {})
                      )
                    })),
                    pointRadius: 20,
                    datalabels: {
                      display: "auto",
                      rotation: 90
                    },
                    borderColor: "transparent",
                    backgroundColor: "transparent",
                    // datalabels: {
                    //   color: '#FFCE56'
                    // },
                    label: "Events",
                    // tension: 0.1,

                    // borderColor: 'rgb(75, 192, 192)',
                    // pointBackgroundColor: 'rgb(75, 192, 192)',
                  }
                ]
              }

              data.datasets.push(...newEventData.datasets)
              break
            case 'trend':
              const xAxisIsNumberNotDate = !isNaN(Number(chartDataObject[chartTrendNames[0]][0]))
              // console.log('xAxisIsNumberNotDate: ', xAxisIsNumberNotDate)
              const newData: ChartData<'scatter', ScatterDataPoint[]> = {
                datasets: chartTrendNames
                  .slice(1) // The first column will be used for the x axis
                  .filter((columnName) => (!isNaN(Number(chartDataObject[columnName][0]))))
                  .map((columnName, index) => ({
                    data: chartDataObject[chartTrendNames[0]].map((xValue, i) => ({
                      x: (xAxisIsNumberNotDate) ? new Number(xValue) as number : new Date(xValue), // Convert to Date object if xValue is a string
                      y: Number(chartDataObject[columnName][i])
                    })),
                    mode: 'lines+markers',
                    datalabels: {
                      display: false
                    },
                    backgroundColor:
                      (columnName.toLocaleLowerCase().includes('oil')) ?
                        `hsl(120, 70%, 30%)` : // bright green
                        (columnName.toLocaleLowerCase().includes('gas')) ?
                          `hsl(0, 70%, 60%)` : // bright red
                          (columnName.toLocaleLowerCase().includes('water')) ?
                            `hsl(240, 70%, 60%)` : //bright blue
                            generateColor(index),
                    label: columnName,
                  })
                  )
              }

              data.datasets.push(...newData.datasets)
              break
          }
          return chartTrendNames[0]
        })

        if (!data.datasets[0]) return //No data sets found in query

        // console.log('chart data:\n', data)


        // console.log("First X data Point: ", data.datasets[0].data[0].x)
        // console.log("First X data Point Is Date: ", data.datasets[0].data[0].x instanceof Date)

        const options: ChartOptions<'scatter'> = {
          // responsive: true,
          scales: {//If the first x data point is a number an not a date, use a number x axis
            x: (data.datasets[0].data[0].x instanceof Date) ? {
              type: 'time' as const,
              time: {
                unit: 'day' as const,
                tooltipFormat: 'PP',
                displayFormats: {
                  day: 'yyyy MMM d',
                },
              },
              title: {
                display: true,
                text: 'date',
              },
              adapters: {
                date: {
                  locale: enUS,
                },
              },
            } : {//Here is the title if the x axis is numberic
              title: {
                display: true,
                text: xAxisLabels.join('\n'),
              }
            },
            y: {
              type: 'logarithmic' as const,
              title: {
                display: true,
                text: 'Value (log scale)',
              },
            },
          },
          onClick: (_event, elements) => {
            if (elements.length > 0) {
              const datasetIndex = elements[0].datasetIndex;
              const index = elements[0].index;
              const url = data.datasets[datasetIndex].data[index].url
              if (data.datasets[datasetIndex].label === 'Events' && url) window.open(url, '_blank');
            }
          },
          plugins: {
            title: {
              text: chartTitle,
              display: true
            },
            zoom: {
              pan: {
                enabled: true,
                modifierKey: "alt"
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                drag: {
                  enabled: true,
                  modifierKey: "shift"
                },
              }
            },
            datalabels: {
              display: 'auto', //Hide overlapped data
              color: 'black',
              backgroundColor: 'white',
              borderRadius: 4,
              font: {
                weight: "bold"
              },
              formatter: function () {//value, context) {
                return 'event'
              }
            },

            tooltip: {
              callbacks: {
                label: function (context) {
                  // Check if the dataset label is "Events"
                  if (context.dataset.label === "Events") {
                    // Custom tooltip for Events
                    const datasetIndex = context.datasetIndex;
                    const index = context.dataIndex
                    const rowData = data.datasets[datasetIndex].data[index].rowData
                    return rowData?.split('\n')
                    // return `Line 1\nLine 2\nLine 3`.split("\n");
                    // return `Events: ${context.parsed.y}`; // Modify this according to your needs
                  }
                  // Return default tooltip for other datasets
                  return `${context.dataset.label}\n${context.parsed.y}\n${new Date(context.parsed.x)}`.split('\n');
                  // return [context.dataset.label,  context.parsed.y!, context.parsed.x!]
                }
              }
            }

          }
        };

        const newMessagePlot = () => <>
          {/* <pre
            style={{ //Wrap long lines
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {stringify(props.message)}
          </pre> */}
          <Scatter
            data={data}
            options={options}
          />
        </>

        // console.log("Number of table tool response messages: ", toolResponseMessages.length)
        // console.log("New Data: ", newMessagePlot().props.children?.props?.data)
        // console.log("Previous Data: ", MessagePlot && MessagePlot().props.children?.props?.data)
        if (
          !MessagePlot ||
          JSON.stringify(newMessagePlot().props.children?.props?.data) !== JSON.stringify(MessagePlot().props.children?.props?.data)
        ) {
          // console.log("Number of datasets: ", data.datasets.length)
          // console.log("Number of table tool response messages: ", toolResponseMessages)
          // console.log('Previous Message Plot Props: ', MessagePlot && MessagePlot().props)
          // console.log('New Message Plot Props: ', newMessagePlot().props.children?.props)
          setMessagePlot(() => newMessagePlot)
        }

      case 'tool_table_events':
      case 'tool_table_trend':
        // https://mui.com/x/react-data-grid/
        // const queryResponseData: { [key: string]: (string | number)[] } = JSON.parse(props.message.content as string).queryResponseData
        const queryResponseData: RowDataInput = JSON.parse(props.message.content as string).queryResponseData

        if (!queryResponseData || queryResponseData.length === 0) {
          // console.log('no query response data')
          return
        }

        // console.log('Query Response Data: ', queryResponseData)
        if (!queryResponseData[0]) {
          console.warn('No query response data')
          return
        }

        const columnNames = Object.keys(queryResponseData[0])

        const columns: GridColDef<TransformToDataRowsOutputData>[] = columnNames
          .filter((columnName) => !nonDefaultColumns.includes(columnName))
          .map((name) => ({
            field: `${name}`,
            headerName: `${name}`,
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
              <div style={{
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                lineHeight: 'normal',
                width: '100%'
              }}>
                {params.value}
              </div>
            ),
          }));

        if (columnNames.includes('s3Key')) {
          columns.push({
            field: 's3Key',
            headerName: 'Document Links',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
              if (!params.value) return
              return (
                <Box display='flex' flexDirection='column'>
                  <Link href={`/files/${params.value.slice(0, -5)}`} target="_blank" rel="noopener">
                    pdf link
                  </Link>
                  <Link href={`/files/${params.value}`} target="_blank" rel="noopener">
                    yaml link
                  </Link>
                </Box>
              )
            },

          })
        }

        const rowData: TransformToDataRowsOutputData[] = queryResponseData.map((item, index) => ({
          id: `${index}`,
          ...item
        }))

        // console.log('Row Data: ', rowData)
        const newMessageTable = () => (
          <>
            {/* <pre
              style={{ //Wrap long lines
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {stringify(JSON.parse(props.message.content))}
            </pre> */}

            <DataGrid
              rows={rowData}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 5,
                  },
                },
              }}
              pageSizeOptions={[5]}
              checkboxSelection
              disableRowSelectionOnClick

              getRowHeight={() => 'auto'}

              sx={{
                '& .MuiDataGrid-cell': {
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-row': {
                  maxHeight: 'none !important',
                },
                '& .MuiDataGrid-renderingZone': {
                  maxHeight: 'none !important',
                },
                '& .MuiDataGrid-virtualScroller': {
                  // Disable virtual scrolling
                  overflowY: 'visible !important',
                },
              }}
            />
          </>

        )

        if (!MessageTable) {
          setMessageTable(() => newMessageTable)

        }


    }
  }, [props.message, messageContentCategory, MessageTable, MessagePlot])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function getGlossary(message: Message) {

    if (!message.chatSessionId) throw new Error(`No chat session id in message: ${message}`)

    if (message.chatSessionId in glossaryBlurbs) return

    const getGlossaryPrompt = `
    Return a glossary for terms found in the text blurb below:

    ${message.content}
    `
    const newBlurb = await invokeBedrockModelParseBodyGetText(getGlossaryPrompt)
    if (!newBlurb) throw new Error("No glossary blurb returned")
    setGlossaryBlurbs((prevGlossaryBlurbs) => ({ ...prevGlossaryBlurbs, [message.chatSessionId || "ShouldNeverHappen"]: newBlurb }))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function getDataQualityCheck(message: Message) {
    setDataQualityBlurb("")

    if (!message.chatSessionId) throw new Error(`No chat session id in message: ${message}`)

    const dataQualityCheckResponse = await amplifyClient.queries.invokeBedrockWithStructuredOutput({
      chatSessionId: message.chatSessionId,
      lastMessageText: "What data quality issues can you identify in the messages above?",
      outputStructure: JSON.stringify(getDataQualityCheckSchema)
    })
    console.log("Data Quality Check Response: ", dataQualityCheckResponse)
    if (dataQualityCheckResponse.data) {
      const newDataQualityChecks = JSON.parse(dataQualityCheckResponse.data).dataChecks as string[]
      if (newDataQualityChecks.length) {
        setDataQualityBlurb(() => newDataQualityChecks.join('\n\n'))
      } else {
        setDataQualityBlurb(() => "No data quality issues identified")
      }


    } else console.log('No suggested prompts found in response: ', dataQualityCheckResponse)


  }

  // console.log('messagePlot:', MessagePlot);
  // console.log('Type of messagePlot:', typeof MessagePlot);
  // console.log('Is valid React element:', React.isValidElement(MessagePlot));

  return (
    <div
      key={props.message.id}
      id={props.message.content}
    >
      {props.message?.role != 'human' && (
        <Container>
          {/* <div className={styles.btn_chabot_message_copy}>
            <Popover
              size="medium"
              position="top"
              triggerType="custom"
              dismissButton={false}
              content={
                <StatusIndicator type="success">
                  Copied to clipboard
                </StatusIndicator>
              }
            >
              <Button
                variant="inline-icon"
                iconName="copy"
                onClick={() => {
                  navigator.clipboard.writeText(props.message.content);
                }}
              />
            </Popover>
          </div>

          {props.message.chatSessionId ? (
            <>
              <div className={styles.btn_chabot_message_copy}>
                <Popover
                  size="medium"
                  position="top"
                  triggerType="custom"
                  dismissButton={false}
                  content={
                    <p>
                      {dataQualityBlurb ? dataQualityBlurb : <Spinner />}
                    </p>
                  }
                >
                  <Button
                    onClick={() => getDataQualityCheck(props.message)}
                  >
                    Data Quality Check
                  </Button>
                </Popover>
              </div>

              <div className={styles.btn_chabot_message_copy}>
                <Popover
                  size="medium"
                  position="top"
                  triggerType="custom"
                  dismissButton={false}
                  content={
                    <p>
                      {glossaryBlurbs[props.message.chatSessionId] ? glossaryBlurbs[props.message.chatSessionId] : <Spinner />}
                    </p>
                  }
                >
                  <Button
                    onClick={() => getGlossary(props.message)}
                  >
                    Show Glossary
                  </Button>
                </Popover>
              </div>
            </>
          ) : null
          }

          {props.message.trace ? (
            <div className={styles.btn_chabot_message_copy}>
              <Popover
                size="medium"
                position="top"
                triggerType="custom"
                dismissButton={false}
                content={
                  <p>{props.message.trace}</p>
                }
              >
                <Button>
                  Chain Of Thought
                </Button>
              </Popover>
            </div>
          ) : null
          } */}

          {/* If the tool returns a table, add the show / hide rows button */}
          {messageContentCategory === 'tool_table_events' ? (
            <div className={styles.btn_chabot_message_copy}>
              <Popover
                size="medium"
                position="top"
                triggerType="custom"
                dismissButton={false}
                content={
                  <StatusIndicator type="success" />
                }
              >
                <Button
                  onClick={() => {
                    setHideRows(prevState => !prevState);
                  }}
                >
                  {hideRows ? 'Show All Rows' : 'Hide Low Relevance Rows'}
                </Button>
              </Popover>
            </div>
          ) : null}

          <strong>{formatDate(props.message.createdAt)}</strong>
          {/* Show the tool call id if it exists */}
          {props.message.tool_call_id ? (
            <div>
              <p>Tool Name: {props.message.tool_name}</p>
            </div>
          ) : null
          }

          {/* Here's where the body of the message renders */}
          {/* This will render a table */}
          {/* {props.message.tool_name && !isValidJSON(props.message.content) && !isValidYAML(props.message.content) ? ( */}
          {/* First lets decide if the message comes from a tool or not */}
          {(() => {
            switch (messageContentCategory) {
              case 'tool_plot':
                return <>
                  {/* <MessagePlot/> */}
                  {MessagePlot && <MessagePlot />}
                </>
              case 'tool_table_events':
              case 'tool_table_trend':
                return <>
                  {/* <pre>{props.message.content}</pre> */}
                  {MessageTable && <MessageTable />}
                </>
              case 'tool_json':
                return <pre
                  style={{ //Wrap long lines
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {
                    isValidJSON(props.message.content) ?
                      stringify(JSON.parse(props.message.content)) :
                      props.message.content
                  }
                </pre>/* Render as YAML */;
              default:
                return <div className="prose !max-w-none w-full" >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {props.message.content}
                  </ReactMarkdown>
                </div>;
            }
          })()}

          {/* Show tool call ids and tool calls if they exist */}
          {props.message.tool_call_id ? (
            <div>
              <p>Tool Call Id: {props.message.tool_call_id}</p>
            </div>
          ) : null
          }
          {props.message.tool_calls && typeof props.message.tool_calls === 'string' && JSON.parse(props.message.tool_calls).length > 0 ? (
            <div>
              <strong>Tool Calls:</strong>
              <pre>{stringify(JSON.parse(props.message.tool_calls), null, 2)}</pre>
            </div>
          ) : null
          }
        </Container>
      )
      }
      {
        props.message?.role === 'human' && (
          <>
            <strong>{formatDate(props.message.createdAt)}</strong>
            <ReactMarkdown>
              {props.message.content}
            </ReactMarkdown>
            {/* <pre
              style={{ //Wrap long lines
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {props.message.content}
            </pre> */}

          </>
        )
      }
    </div >
  );
}
