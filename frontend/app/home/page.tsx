import Image from "next/image";
import Header from "../components/Header";

const items = [
    {
        authors: "James Ang • Jared Minoza | 2025",
        title: "This is an example title: Example research, thesis, or capstone title here Lorem Ipsum dolor vsit amet",
        summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
        tags: ["AI/ML", "Data Science", "Godwin"],
    },
    {
        authors: "Avryl Joie Arranguez • Homer Adriel Dorin | 2023",
        title: "This is an example title: Example research, thesis, or capstone title here Lorem Ipsum dolor vsit amet",
        summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
        tags: ["Algorithms", "Data Science", "Pena"]
    },
    {
        authors: "Matt Erron Cabarrubias • Dustin Jesse Balansag | 2025",
        title: "This is an example title: Example research, thesis, or capstone title here Lorem Ipsum dolor vsit amet",
        summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
        tags: ["Web Development", "Data Science", "Elalto"]
    },
    {
        authors: "Leira Bengil • Jian Bryce Machacon | 2024",
        title: "This is an example title: Example research, thesis, or capstone title here Lorem Ipsum dolor vsit amet",
        summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
        tags: ["AI/ML", "Data Science", "Godwin"]
    }
]

export default function Home() {
    return (
        <main>
            <Header />
            <span>Home page</span>
        </main>
    )

}