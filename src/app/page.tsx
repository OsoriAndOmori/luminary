export default function Home() {
    return (
        <div
            style={{
                margin: 0,
                padding: 0,
                height: "100vh",
                backgroundColor: "black",
                color: "white",
                fontFamily: "Arial, sans-serif",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                textAlign: "center",
            }}
        >
            <img
                src="/images/luminary.jpg"
                alt="Centered"
                style={{
                    maxWidth: "400px",
                    maxHeight: "300px",
                    marginBottom: "20px",
                    border: "2px solid white",
                    borderRadius: "10px",
                }}
            />
            <h1 style={{fontSize: "24px", textTransform: "uppercase"}}>
                Luminary
            </h1>
        </div>
    );
}
