import Display from './Display';

async function showCrossword(display: Display, idValue: string)
{
    const response = await fetch(`crosswords/${idValue}.json`);
    if (!response.ok) 
    {
        throw new Error("Can't retrieve crossword");
    }
    const crossword_json = await response.json();
    await display.showCrossword(crossword_json, {});
}

async function showSingle(display: Display, crosswordId: string, 
                          direction: string, defId: string)
{

    const response = await fetch(`crosswords/${crosswordId}.json`);
    if (!response.ok) 
    {
        throw new Error("Can't retrieve crossword");
    }
    const crossword_json = await response.json();
    await display.showSingle(crossword_json, direction, defId);
}

async function showIndex(display: Display)
{
    const response = await fetch(`index.json`);
    const json = await response.json()
    display.showIndex(json);
}

async function showWebpage()
{
    let display : Display;

    const queryString = window.location.search;
    const idMatch = queryString.match(/id=(\d+)/);
    const singleMatch = queryString.match(/single=(\d+)\.(across|down)\.(\d+)/);
    display = new Display();

    try 
    {
        if (idMatch)
        {
            await showCrossword(display, idMatch[1]);
        }
        else if (singleMatch)
        {
            await showSingle(display, singleMatch[1], singleMatch[2], singleMatch[3]);
        }
        else
        {
            await showIndex(display);
        }
    }
    catch (err)
    {
        console.log(err);
        await showIndex(display);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    await showWebpage();
});