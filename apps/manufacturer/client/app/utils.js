var generateSN = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    function s1() {
        return Math.floor(Math.random() * 10);
    }
    return s4() + s4() + s1() + s1() + s1();
}