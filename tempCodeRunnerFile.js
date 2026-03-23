const followUp = await chat.sendMessageStream({
  message: "What was the first thing I asked you in this conversation?"
});

for await (const chunk of followUp) {
  process.stdout.write(chunk.text);
}
console.log();