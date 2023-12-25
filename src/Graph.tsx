import React, { Component } from 'react';
import { Table } from '@finos/perspective'; //use finos npm library for data visualisation
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement{
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  //receives server response (obtained through the DataStreamer) in the props

  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    //add html attributes to the graph element
    elem.setAttribute('view', 'y_line'); //define the type of graph to visualise
    elem.setAttribute('column-pivots', '["stock"]'); //field to differentiate between the lines for the two stocks + add labels
    elem.setAttribute('row-pivots', '["timestamp"]'); //x-axis data
    elem.setAttribute('columns', '["top_ask_price"]'); //dictionary key used to plot the data along the y-axis
    elem.setAttribute('aggregates', 
                      `
                        {"stock": "distinct count", 
                        "top_ask_price": "avg", 
                        "top_bid_price": "avg", 
                        "timestamp": "distinct count"}
                      `); //use to combine repated datapoint
                          //data point is determined to be unique if the values of 'stock' and 'timestamp' are both unique
                          //for two non-unique data points, they are combined into a single data point with the average values for
                          //top_ask_price and top_bid_price

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // Add more Perspective configurations here.
      elem.load(this.table);
    }
  }

  componentDidUpdate() {
    console.log('db');
    // Everytime the data props is updated, insert the data into Perspective table
    console.log(this.props);

    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
