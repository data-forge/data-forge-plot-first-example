
const request = require('request-promise');
const dataForge = require('data-forge');
require('data-forge-indicators'); // For the 'sma' function.
require('data-forge-plot'); // For the 'plot' function.

async function main () {

    const url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&apikey=demo&datatype=csv";
    const response = await request(url); // Request the data from Alpha Vantage.
    const df = dataForge.fromCSV(response, { dynamicTyping: true }) // Deserialize CSV data.
        .parseDates("timestamp", "YYYY-MM-DD"); // Parse dates from strings.

    console.log("Retreived:");
    console.log(df.head(10).toStrings("timestamp", "YYYY-MM-DD").toString());

    const chronoOrder = df.bake().reverse(); // Reverse the data series to put it in forward chronological order.
    const indexedDf = chronoOrder.setIndex("timestamp"); // Use the date as the index of the dataframe.
    const close = indexedDf.getSeries("close"); // Extract the closing price time series.
    await close.plot({}, { series: { __value__: "Microsoft Close" }}) // Plot the closing price to a chart (using default options).
        .renderImage("./MSFT-close.png"); // Render the closing price chart to a PNG file.

    const indexedClose = indexedDf.getSeries("close"); // Extract the closing price time series.
    const sma = indexedClose.sma(30); // Compute a 30 day simple moving average (using data-forge-indicators);
    console.log("SMA:");
    console.log(sma.head(10).resetIndex().toString());

    const merged = indexedDf.withSeries({ SMA: sma }).skip(30); // Merge the sma into the original data.
    console.log("Merged:");
    console.log(merged.skip(30).head(10).resetIndex().toStrings("timestamp", "YYYY-MM-DD").dropSeries("volume").toString());

    const plot = merged.plot({}, { y: ["close", "SMA"] }); // Plot a chart with close and SMA on the Y axis.
    await plot.renderImage("./MSFT-sma.png", { openImage: true }); // Render chart to image.    
    await plot.exportWeb("./web-export", { overwrite: true, openBrowser: true }); // Export a web page with the chart and data. Whoa!
}


main()
    .then(() => console.log("Done"))
    .catch(err => console.error(err && err.stack || err));