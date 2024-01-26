import css from "./About.sass?inline"
import { Html } from "jet-std"
import { createElement } from "jet-tsx"

export const About = (
    <section className={Html.adoptStyleSheet(css, "about")}>
        <h1>About</h1>
        <h4>Compact is a mobile friendly audiotool music browser</h4>
        <p>Please be advised that Compact is an independent demo project developed by <a
            href="https://hello.andremichelle.io/">andré michelle</a>.<br />
            Compact is not commissioned, endorsed, sponsored, or affiliated with audiotool or its official
            services in any capacity. <a href="https://hello.andremichelle.io/">andré michelle</a> has developed this
            Application solely for the purpose of demonstrating the capabilities of the <a
                href="https://github.com/andremichelle/jsx">JSX</a> UI-framework and does not receive any form of
            compensation from audiotool for this project. Compact is not intended to be perceived as an official
            audiotool application nor does it represent the brand or services of audiotool. The audiotool api used in
            this project is publicly available, and no internal knowledge or proprietary information from audiotool has
            been utilized to fetch data from their servers.
        </p>
        <p>
            Source code can be forked from <a href="https://github.com/andremichelle/compact/">github</a> | <a
            href="https://www.npmjs.com/settings/andremichelle/packages">npm packages</a>
        </p>
        <p>
            Developer: <a href="https://hello.andremichelle.io/">andré michelle</a><br />
            Specialization: Web Development with a focus on Web Audio Projects and Casual Games<br />
            Contact: andre.michelle at gmail dot com<br />
            Location: Cologne, Germany
        </p>
    </section>
)