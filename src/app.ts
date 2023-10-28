import Display from './Display';

async function showWebpage()
{
    let display : Display;

    const queryString = window.location.search;
    const idPattern = /id=(\d+)/;
    const match = queryString.match(idPattern);
    display = new Display();

    try 
    {
        if (!match)
        {
            throw new Error("Can't find crossword ID");
        }

        const idValue = match[1]; 
        const response = await fetch(`crosswords/${idValue}.json`);
        if (!response.ok) 
        {
            throw new Error("Can't retrieve crossword");
        }
        const crossword_json = await response.json();
        await display.showCrossword(crossword_json);
    }
    catch (err)
    {
        console.log(err);
        const response = await fetch(`index.json`);
        const json = await response.json()
        display.showIndex(json);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    await showWebpage();
});