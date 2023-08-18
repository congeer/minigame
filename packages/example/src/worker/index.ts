const onMessage = (data: any) => {
    console.log(data);
    switch (data.type) {
        case 'store': {
            const {key, value} = data;
            console.log(worker)
        }
    }
};

try {
    worker.onMessage(onMessage)
} catch (e) {
    try {
        // @ts-ignore
        self.worker = self
        onmessage = (event) => onMessage(event.data)
    } catch (e) {

    }
}
